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

export function proxy(request: NextRequest) {
     const accessToken = request.cookies.get("access")?.value;
     const isAuthenticated = hasValidAccessToken(accessToken);

     const pathname = request.nextUrl.pathname;

     const isProtected =
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/group");

     const isAuthRoute =
          pathname === "/login" ||
          pathname === "/register" ||
          pathname.startsWith("/reset");

     // Not logged in
     if (isProtected && !isAuthenticated) {
          return NextResponse.redirect(new URL("/login", request.url));
     }

     // Logged in users should not stay on auth pages
     if (isAuthRoute && isAuthenticated) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
     }

     return NextResponse.next();
}

export const config = {
     matcher: [
          "/dashboard/:path*",
          "/group/:path*",
          "/login",
          "/register",
          "/reset/:path*",
     ],
};
