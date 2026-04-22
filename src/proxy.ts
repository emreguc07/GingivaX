// src/proxy.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;
    
    // Admin check
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // Doctor check (Admins can also see doctor panels if they want, but let's stick to doctor)
    if (pathname.startsWith("/doctor") && token?.role !== "DOCTOR" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*"],
};
