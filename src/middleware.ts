import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) return;

  if (isLoggedIn && (pathname === "/login" || pathname === "/setup")) {
    return Response.redirect(new URL("/pensions", req.nextUrl));
  }

  if (!isLoggedIn && pathname !== "/login" && pathname !== "/setup") {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
