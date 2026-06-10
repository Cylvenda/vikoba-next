import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): { exp?: number } | null {
     const parts = token.split(".");
     if (parts.length !== 3) return null;

     try {
          const payload = parts[1];
          const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
          return JSON.parse(atob(padded)) as { exp?: number };
     } catch {
          return null;
     }
}

function hasValidAccessToken(token?: string): boolean {
     if (!token) return false;
     const payload = decodeJwtPayload(token);
     if (!payload || typeof payload.exp !== "number") return false;
     return payload.exp * 1000 > Date.now();
}

function hasValidRefreshToken(token?: string): boolean {
     if (!token) return false;
     const payload = decodeJwtPayload(token);
     if (!payload || typeof payload.exp !== "number") return false;
     return payload.exp * 1000 > Date.now();
}

export function proxy(request: NextRequest) {
     const accessToken = request.cookies.get("access")?.value;
     const refreshToken = request.cookies.get("refresh")?.value;
     const isAuthenticated = hasValidAccessToken(accessToken);

     const pathname = request.nextUrl.pathname;
     const hasValidRefresh = hasValidRefreshToken(refreshToken);

     const isProtected =
          pathname.startsWith("/admin") ||
          pathname.startsWith("/home") ||
          pathname.startsWith("/group") ||
          pathname.startsWith("/meeting");

     const isAuthPage = pathname === "/login" || pathname === "/register";

     // Already logged in — bounce away from auth pages
     if (isAuthPage && (isAuthenticated || hasValidRefresh)) {
          return NextResponse.redirect(new URL("/home", request.url));
     }

     // Not logged in — protect private routes
     if (isProtected && !isAuthenticated && !hasValidRefresh) {
          return NextResponse.redirect(new URL("/login", request.url));
     }

     return NextResponse.next();
}

export const config = {
     matcher: [
          "/admin/:path*",
          "/home/:path*",
          "/group/:path*",
          "/meeting/:path*",
          "/login",
          "/register",
          "/reset/:path*",
     ],
};
