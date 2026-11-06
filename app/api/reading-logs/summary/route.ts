import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GENRE_PRIORITY: Record<string, number> = {
  Fiction: 1,
  "Non-Fiction": 2,
  "Sci-Fi": 3,
  Biography: 4,
  Other: 5,
};

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
      select: {
        genre: true,
        minutesRead: true,
        favorite: true,
      },
    });

    if (logs.length === 0) {
      return NextResponse.json(
        {
          count: 0,
          favoriteCount: 0,
          totalMinutes: 0,
          breakdown: [],
        },
        { status: 200 }
      );
    }

    let count = 0;
    let favoriteCount = 0;
    let totalMinutes = 0;

    const genreMap: Record<string, { count: number; total: number }> = {};

    for (const log of logs) {
      count += 1;
      if (log.favorite) {
        favoriteCount += 1;
      }
      totalMinutes += log.minutesRead;

      if (!genreMap[log.genre]) {
        genreMap[log.genre] = { count: 0, total: 0 };
      }
      genreMap[log.genre].count += 1;
      genreMap[log.genre].total += log.minutesRead;
    }

    const breakdown = Object.entries(genreMap)
      .map(([g, data]) => ({
        genre: g,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        const prioA = GENRE_PRIORITY[a.genre] ?? 99;
        const prioB = GENRE_PRIORITY[b.genre] ?? 99;
        return prioA - prioB;
      });

    return NextResponse.json(
      {
        count,
        favoriteCount,
        totalMinutes,
        breakdown,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/reading-logs/summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

