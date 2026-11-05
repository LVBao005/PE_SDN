import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORY_PRIORITY: Record<string, number> = {
  Food: 1,
  Transport: 2,
  Bills: 3,
  Shopping: 4,
  Other: 5,
};

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
      select: {
        category: true,
        amount: true,
        starred: true,
      },
    });

    if (expenses.length === 0) {
      return NextResponse.json(
        {
          count: 0,
          starredCount: 0,
          totalAmount: 0,
          breakdown: [],
        },
        { status: 200 }
      );
    }

    let count = 0;
    let starredCount = 0;
    let totalAmount = 0;

    const categoryMap: Record<string, { count: number; total: number }> = {};

    for (const exp of expenses) {
      count += 1;
      if (exp.starred) {
        starredCount += 1;
      }
      totalAmount += exp.amount;

      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { count: 0, total: 0 };
      }
      categoryMap[exp.category].count += 1;
      categoryMap[exp.category].total += exp.amount;
    }

    const breakdown = Object.entries(categoryMap)
      .map(([cat, data]) => ({
        category: cat,
        count: data.count,
        total: Math.round(data.total * 100) / 100,
      }))
      .sort((a, b) => {
        // Sort by total descending
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        // Tie-break: Food -> Transport -> Bills -> Shopping -> Other
        const prioA = CATEGORY_PRIORITY[a.category] ?? 99;
        const prioB = CATEGORY_PRIORITY[b.category] ?? 99;
        return prioA - prioB;
      });

    return NextResponse.json(
      {
        count,
        starredCount,
        totalAmount: Math.round(totalAmount * 100) / 100,
        breakdown,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/expenses/summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

