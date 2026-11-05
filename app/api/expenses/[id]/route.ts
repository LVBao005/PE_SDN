import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Other"] as const;

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
    const existing = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { title, amount, category, note, spentAt, date, starred } = body;
    const expenseDate = spentAt ?? date;

    const updateData: any = {};

    // Validate Title if updated
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 80) {
        return NextResponse.json({ error: "Title must be at most 80 characters" }, { status: 400 });
      }
      updateData.title = trimmedTitle;
    }

    // Validate Amount if updated
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount)) {
        return NextResponse.json({ error: "Amount is required" }, { status: 400 });
      }
      if (numAmount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      updateData.amount = numAmount;
    }

    // Validate Category if updated
    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return NextResponse.json({ error: "Please choose a category" }, { status: 400 });
      }
      const trimmedCategory = category.trim();
      if (!VALID_CATEGORIES.includes(trimmedCategory as any)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      updateData.category = trimmedCategory;
    }

    // Validate Date if updated
    if (expenseDate !== undefined) {
      if (typeof expenseDate !== "string" || !expenseDate.trim()) {
        return NextResponse.json({ error: "Date is required" }, { status: 400 });
      }
      const trimmedDate = expenseDate.trim();
      const todayStr = getTodayString();
      if (trimmedDate > todayStr) {
        return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
      }
      updateData.spentAt = trimmedDate;
    }

    // Note if updated
    if (note !== undefined) {
      updateData.note = typeof note === "string" ? note.trim() : "";
    }

    // Starred if updated
    if (starred !== undefined) {
      updateData.starred = Boolean(starred);
    }

    // Check duplicate if title, amount or spentAt changed
    const finalTitle = updateData.title ?? existing.title;
    const finalAmount = updateData.amount ?? existing.amount;
    const finalSpentAt = updateData.spentAt ?? existing.spentAt;

    if (
      updateData.title !== undefined ||
      updateData.amount !== undefined ||
      updateData.spentAt !== undefined
    ) {
      const duplicate = await prisma.expense.findFirst({
        where: {
          userId: user.id,
          title: finalTitle,
          amount: finalAmount,
          spentAt: finalSpentAt,
          NOT: { id: existing.id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Duplicate expense: an expense with the same title, amount and date already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        amount: true,
        category: true,
        note: true,
        starred: true,
        spentAt: true,
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
    console.error("PATCH /api/expenses/[id] error:", error);
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

    const existing = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

