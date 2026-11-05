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

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const starred = searchParams.get("starred");
    const q = searchParams.get("q");

    const where: any = {
      userId: user.id,
    };

    if (category && category.trim()) {
      where.category = category.trim();
    }

    if (starred !== null && starred !== undefined && starred !== "") {
      where.starred = starred === "true";
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { note: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [
        { spentAt: "desc" },
        { title: "asc" },
      ],
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

    // Ensure note is string (default "")
    const formatted = expenses.map((e) => ({
      ...e,
      note: e.note ?? "",
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
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

    const { title, amount, category, note, spentAt, date } = body;
    const expenseDate = spentAt || date;

    // Validate Title
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 80) {
      return NextResponse.json({ error: "Title must be at most 80 characters" }, { status: 400 });
    }

    // Validate Amount
    if (amount === undefined || amount === null || amount === "") {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }
    if (numAmount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    // Validate Category
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Please choose a category" }, { status: 400 });
    }
    const trimmedCategory = category.trim();
    if (!VALID_CATEGORIES.includes(trimmedCategory as any)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Validate Date
    if (!expenseDate || typeof expenseDate !== "string" || !expenseDate.trim()) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    const trimmedDate = expenseDate.trim();
    const todayStr = getTodayString();
    if (trimmedDate > todayStr) {
      return NextResponse.json({ error: "Date cannot be in the future" }, { status: 400 });
    }

    // Check Duplicate
    const existing = await prisma.expense.findFirst({
      where: {
        userId: user.id,
        title: trimmedTitle,
        amount: numAmount,
        spentAt: trimmedDate,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate expense: an expense with the same title, amount and date already exists" },
        { status: 409 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        title: trimmedTitle,
        amount: numAmount,
        category: trimmedCategory,
        note: (note ?? "").trim(),
        starred: false,
        spentAt: trimmedDate,
      },
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
        ...expense,
        note: expense.note ?? "",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

