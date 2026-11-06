import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_GENRES = ["Fiction", "Non-Fiction", "Sci-Fi", "Biography", "Other"] as const;

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Verify ownership
    const existing = await prisma.readingLog.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reading log not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { bookTitle, minutesRead, genre, note, readOn, date, favorite } = body;
    const sessionDate = readOn ?? date;

    const updateData: any = {};

    // Validate Book Title if provided
    if (bookTitle !== undefined) {
      if (typeof bookTitle !== "string" || !bookTitle.trim()) {
        return NextResponse.json({ error: "Book title is required" }, { status: 400 });
      }
      const trimmedTitle = bookTitle.trim();
      if (trimmedTitle.length > 80) {
        return NextResponse.json({ error: "Book title must be at most 80 characters" }, { status: 400 });
      }
      updateData.bookTitle = trimmedTitle;
    }

    // Validate Minutes Read if provided
    if (minutesRead !== undefined) {
      const numMinutes = Number(minutesRead);
      if (isNaN(numMinutes)) {
        return NextResponse.json({ error: "Minutes read is required" }, { status: 400 });
      }
      if (numMinutes <= 0) {
        return NextResponse.json({ error: "Minutes read must be a positive number" }, { status: 400 });
      }
      updateData.minutesRead = Math.round(numMinutes);
    }

    // Validate Genre if provided
    if (genre !== undefined) {
      if (typeof genre !== "string" || !genre.trim()) {
        return NextResponse.json({ error: "Please choose a genre" }, { status: 400 });
      }
      const trimmedGenre = genre.trim();
      if (!VALID_GENRES.includes(trimmedGenre as any)) {
        return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
      }
      updateData.genre = trimmedGenre;
    }

    // Validate Date if provided
    if (sessionDate !== undefined) {
      if (typeof sessionDate !== "string" || !sessionDate.trim()) {
        return NextResponse.json({ error: "Date is required" }, { status: 400 });
      }
      const trimmedDate = sessionDate.trim();
      const todayStr = getTodayString();
      if (trimmedDate > todayStr) {
        return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
      }
      updateData.readOn = trimmedDate;
    }

    // Note if provided
    if (note !== undefined) {
      updateData.note = typeof note === "string" ? note.trim() : "";
    }

    // Favorite if provided
    if (favorite !== undefined) {
      updateData.favorite = Boolean(favorite);
    }

    // Check duplicate if bookTitle, minutesRead or readOn updated
    const finalTitle = updateData.bookTitle ?? existing.bookTitle;
    const finalMinutes = updateData.minutesRead ?? existing.minutesRead;
    const finalDate = updateData.readOn ?? existing.readOn;

    if (
      updateData.bookTitle !== undefined ||
      updateData.minutesRead !== undefined ||
      updateData.readOn !== undefined
    ) {
      const duplicate = await prisma.readingLog.findFirst({
        where: {
          userId: user.id,
          bookTitle: finalTitle,
          minutesRead: finalMinutes,
          readOn: finalDate,
          NOT: { id: existing.id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Duplicate reading session: a reading session with the same book title, minutes and date already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.readingLog.update({
      where: { id: existing.id },
      data: updateData,
      select: {
        id: true,
        bookTitle: true,
        minutesRead: true,
        genre: true,
        note: true,
        favorite: true,
        readOn: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ...updated,
        note: updated.note ?? "",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/reading-logs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.readingLog.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Reading log not found" }, { status: 404 });
    }

    await prisma.readingLog.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/reading-logs/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

