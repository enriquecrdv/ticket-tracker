import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (origin) {
        try {
          const originUrl = new URL(origin);
          const loopback = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
          const allowedLoopback = process.env.NODE_ENV === "development"
            && originUrl.port === request.nextUrl.port
            && loopback.has(originUrl.hostname)
            && loopback.has(request.nextUrl.hostname);
          if (originUrl.host !== request.nextUrl.host && !allowedLoopback) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
        } catch {
          return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
        }
      }
    }
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL(token.role === "CLIENTE" ? "/cliente" : "/analista", request.url));
  }

  if (pathname.startsWith("/analista") && token.role === "CLIENTE") {
    return NextResponse.redirect(new URL("/cliente", request.url));
  }

  if (pathname.startsWith("/cliente") && token.role !== "CLIENTE") {
    return NextResponse.redirect(new URL(token.role === "ADMIN" ? "/admin" : "/analista", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/analista/:path*", "/cliente/:path*", "/api/:path*"],
};
