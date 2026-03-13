import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isBypassedPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.includes(".")
  );
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Gear Locker Staging"',
    },
  });
}

export function proxy(request: NextRequest) {
  const username = process.env.STAGING_ACCESS_USERNAME;
  const password = process.env.STAGING_ACCESS_PASSWORD;

  if (!username || !password || isBypassedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encoded = authHeader.slice("Basic ".length);
  const decoded = atob(encoded);
  const [providedUsername, providedPassword] = decoded.split(":");

  if (providedUsername !== username || providedPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
