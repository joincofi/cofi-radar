import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Skip auth gate in development so the dashboard is visible without a session
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const signIn = new URL("/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all /dashboard/* routes
  matcher: ["/dashboard", "/dashboard/:path*"],
};
