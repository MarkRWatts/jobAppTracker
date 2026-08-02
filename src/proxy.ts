import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];
// Auth.js names the database-session cookie differently depending on
// whether secure cookies are in play (https / production).
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

// Optimistic only — checks cookie presence, never hits the DB (this runs on
// every request, including prefetches). The real check is requireUser() in
// src/lib/auth/dal.ts, called from every page/action/route that touches data.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!isPublic && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

// /api/auth/* must stay reachable (Auth.js's own routes — needed to log in
// at all); /api/attachments/[id] self-enforces with a 401 instead of a
// redirect (see src/app/api/attachments/[id]/route.ts).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
