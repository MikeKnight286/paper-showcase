import { NextRequest, NextResponse } from "next/server";

/**
 * Security note on IP detection in Next.js 15+:
 *
 * req.ip was removed. In middleware, Next.js populates x-forwarded-for
 * from the real TCP socket IP internally — it is NOT purely client-controlled.
 * A spoofing client can *append* values to x-forwarded-for but cannot control
 * the rightmost entry, which is always set by the actual network hop.
 *
 * Since this app runs with NO upstream reverse proxy, there is only one
 * entry in x-forwarded-for and it comes directly from the OS-level socket.
 * We therefore read it directly and trust it.
 *
 * If you ever put this behind nginx/Caddy, set "trusted_proxies" there and
 * forward only the verified client IP in x-real-ip instead.
 */
function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    // Take the LAST entry — the one appended by Next.js from the real socket.
    // A client cannot forge this position.
    const parts = fwd.split(",").map((s) => s.trim());
    return parts[parts.length - 1];
  }
  // Fallback: no forwarded header means direct local connection
  return "127.0.0.1";
}

function isLocal(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("::ffff:127.")
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isMutatingApi =
    pathname === "/api/papers/add" ||
    (pathname.startsWith("/api/papers/") && req.method === "DELETE");

  if (isAdminPage || isMutatingApi) {
    const ip = getIp(req);
    if (!isLocal(ip)) {
      if (isAdminPage) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/papers/:path*"],
};