import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "codementors-secure-production-ready-jwt-secret-key-32-chars-min"
);

const AUTH_COOKIE_NAME = "cm_token";

interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "admin" | "super_admin" | "support";
}

async function verifyToken(req: NextRequest): Promise<TokenPayload | null> {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "student" | "instructor" | "admin" | "super_admin" | "support",
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const user = await verifyToken(req);

  // 1. Canonical Aliases for root dashboard routes
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }
  if (pathname === "/instructor") {
    return NextResponse.redirect(new URL("/instructor/dashboard", req.url));
  }
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // 2. Prevent already authenticated users from accessing /login or /register
  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      const redirectParam = req.nextUrl.searchParams.get("redirect");
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        return NextResponse.redirect(new URL(redirectParam, req.url));
      }

      if (user.role === "admin" || user.role === "super_admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (user.role === "instructor") {
        return NextResponse.redirect(new URL("/instructor/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 3. Student Routes Protection
  if (pathname.startsWith("/student")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Instructor Routes Protection
  if (pathname.startsWith("/instructor")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "instructor" && user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 5. Admin Routes Protection
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/student",
    "/student/:path*",
    "/instructor",
    "/instructor/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
