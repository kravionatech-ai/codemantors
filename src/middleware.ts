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

  // Helper to validate whether a requested redirect path matches the user's role permissions
  const isAllowedRoleRedirect = (targetPath: string, role: string) => {
    if (!targetPath || !targetPath.startsWith("/") || targetPath.startsWith("//")) return false;
    if (targetPath.startsWith("/student") && role !== "student") return false;
    if (targetPath.startsWith("/instructor") && role !== "instructor" && role !== "admin" && role !== "super_admin") return false;
    if (targetPath.startsWith("/admin") && role !== "admin" && role !== "super_admin") return false;
    return true;
  };

  const getCanonicalDashboard = (role: string) => {
    if (role === "admin" || role === "super_admin") return "/admin/dashboard";
    if (role === "instructor") return "/instructor/dashboard";
    return "/student/dashboard";
  };

  // 1. Canonical Aliases for root dashboard routes
  if (pathname === "/dashboard") {
    if (user) {
      return NextResponse.redirect(new URL(getCanonicalDashboard(user.role), req.url));
    }
    return NextResponse.redirect(new URL("/login?redirect=/student/dashboard", req.url));
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
      if (redirectParam && isAllowedRoleRedirect(redirectParam, user.role)) {
        return NextResponse.redirect(new URL(redirectParam, req.url));
      }
      return NextResponse.redirect(new URL(getCanonicalDashboard(user.role), req.url));
    }
    return NextResponse.next();
  }

  // 3. Student Routes Protection - Strictly Gated to Students
  if (pathname.startsWith("/student")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    // Instructors visiting /student routes must be routed to their Instructor Studio
    if (user.role === "instructor") {
      return NextResponse.redirect(new URL("/instructor/dashboard", req.url));
    }
    // Administrators visiting /student routes must be routed to their Admin Panel
    if (user.role === "admin" || user.role === "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (user.role !== "student") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 4. Instructor Routes Protection - Strictly Gated to Instructors and Admins
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

  // 5. Admin Routes Protection - Strictly Gated to Admins
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
