import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

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
  matcher: ["/admin/:path*", "/analista/:path*", "/cliente/:path*"],
};
