import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

// Gemeinsames Passwort statt Login (wie das Phase-1-Gate in Storyteller).
export default async function proxy(req: NextRequest) {
  if (!process.env.APP_PASSWORD) return NextResponse.next();
  if (req.cookies.get(AUTH_COOKIE)?.value === (await authToken())) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!login|api/login|_next|favicon.ico).*)"],
};
