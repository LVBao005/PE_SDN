import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

