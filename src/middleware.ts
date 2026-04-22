import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/app") && !isLoggedIn) {
    const u = new URL("/login", req.nextUrl);
    u.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(u);
  }
  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    return NextResponse.redirect(new URL("/app", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
