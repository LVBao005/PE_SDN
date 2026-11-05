import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "default_sdn302_exam_secret_key_123456789"
);

export interface TokenPayload {
  id: string;
  email: string;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ id: payload.id, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.id && payload.email) {
      return {
        id: payload.id as string,
        email: payload.email as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get("session_token")?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("session_token")?.value;
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify that user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true },
  });

  if (!user) return null;

  return { id: user.id, email: user.email };
}

