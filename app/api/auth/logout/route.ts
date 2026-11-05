import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set({
    name: "session_token",
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

