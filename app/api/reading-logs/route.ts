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

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const genre = searchParams.get("genre");
    const favorite = searchParams.get("favorite");
    const q = searchParams.get("q");

    const where: any = {
      userId: user.id,
    };

    if (genre && genre.trim()) {
      where.genre = genre.trim();
    }

    if (favorite !== null && favorite !== undefined && favorite !== "") {
      where.favorite = favorite === "true";
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { bookTitle: { contains: searchTerm, mode: "insensitive" } },
        { note: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.readingLog.findMany({
      where,
      orderBy: [
        { readOn: "desc" },
        { bookTitle: "asc" },
      ],
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

    const formatted = logs.map((item) => ({
      ...item,
      note: item.note ?? "",
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/reading-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { bookTitle, minutesRead, genre, note, readOn, date } = body;
    const sessionDate = readOn || date;

    // Validate Book Title
    if (!bookTitle || typeof bookTitle !== "string" || !bookTitle.trim()) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }
    const trimmedTitle = bookTitle.trim();
    if (trimmedTitle.length > 80) {
      return NextResponse.json({ error: "Book title must be at most 80 characters" }, { status: 400 });
    }

    // Validate Minutes Read
    if (minutesRead === undefined || minutesRead === null || minutesRead === "") {
      return NextResponse.json({ error: "Minutes read is required" }, { status: 400 });
    }
    const numMinutes = Number(minutesRead);
    if (isNaN(numMinutes)) {
      return NextResponse.json({ error: "Minutes read is required" }, { status: 400 });
    }
    if (numMinutes <= 0) {
      return NextResponse.json({ error: "Minutes read must be a positive number" }, { status: 400 });
    }
    const wholeMinutes = Math.round(numMinutes);

    // Validate Genre
    if (!genre || typeof genre !== "string" || !genre.trim()) {
      return NextResponse.json({ error: "Please choose a genre" }, { status: 400 });
    }
    const trimmedGenre = genre.trim();
    if (!VALID_GENRES.includes(trimmedGenre as any)) {
      return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
    }

    // Validate Date
    if (!sessionDate || typeof sessionDate !== "string" || !sessionDate.trim()) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const trimmedDate = sessionDate.trim();
    const todayStr = getTodayString();
    if (trimmedDate > todayStr) {
      return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
    }

    // Check Duplicate: same bookTitle, minutesRead and readOn for this user
    const existing = await prisma.readingLog.findFirst({
      where: {
        userId: user.id,
        bookTitle: trimmedTitle,
        minutesRead: wholeMinutes,
        readOn: trimmedDate,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate reading session: a reading session with the same book title, minutes and date already exists" },
        { status: 409 }
      );
    }

    const log = await prisma.readingLog.create({
      data: {
        userId: user.id,
        bookTitle: trimmedTitle,
        minutesRead: wholeMinutes,
        genre: trimmedGenre,
        note: (note ?? "").trim(),
        favorite: false,
        readOn: trimmedDate,
      },
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
        ...log,
        note: log.note ?? "",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/reading-logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

