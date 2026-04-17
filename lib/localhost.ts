import { NextRequest } from "next/server";

export function isLocalhost(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown";
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("::ffff:127.")
  );
}
