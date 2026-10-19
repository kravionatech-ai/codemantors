import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "codementors-secure-production-ready-jwt-secret-key-32-chars-min"
);

export const AUTH_COOKIE_NAME = "cm_token";

export type UserRole = "student" | "instructor" | "admin" | "super_admin" | "support";

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: string[];
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthUserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      permissions: (payload.permissions as string[]) || [],
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the current session user from cookies or Authorization Bearer header.
 */
export async function getSessionUser(req?: NextRequest): Promise<AuthUserPayload | null> {
  let token: string | undefined;

  // Check Authorization header first if request is passed
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Fallback to cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // In contexts where cookies() is unavailable
    }
  }

  if (!token) return null;

  return verifyAuthToken(token);
}
