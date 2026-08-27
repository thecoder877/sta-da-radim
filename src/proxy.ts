import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import { clientIp, rateLimit } from "@/lib/security/rateLimit";
import { updateSession } from "@/lib/supabase/middleware";
import { shouldRefreshAuthSession } from "@/lib/supabase/sessionRefresh";

const WRITE_LIMITS: { prefix: string; limit: number; windowMs: number }[] = [
  { prefix: "/api/auth/login", limit: 5, windowMs: 10 * 60 * 1000 },
  { prefix: "/api/auth/register", limit: 8, windowMs: 60 * 60 * 1000 },
  { prefix: "/api/trips/generate", limit: 20, windowMs: 60 * 1000 },
  { prefix: "/api/reviews", limit: 30, windowMs: 60 * 1000 },
  { prefix: "/api/places/submit", limit: 10, windowMs: 60 * 1000 },
  { prefix: "/api/reports", limit: 10, windowMs: 60 * 1000 },
];

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto === "http") {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const path = request.nextUrl.pathname;
    const rule = WRITE_LIMITS.find((item) => path.startsWith(item.prefix));
    if (rule) {
      const limited = rateLimit(
        `${rule.prefix}:${clientIp(request)}`,
        rule.limit,
        rule.windowMs,
      );
      if (!limited.ok) {
        return NextResponse.json(
          { error: "Previše pokušaja. Sačekaj malo.", code: "RATE_LIMITED" },
          { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
        );
      }
    }
  }

  const response = shouldRefreshAuthSession(request.nextUrl.pathname)
    ? await updateSession(request)
    : NextResponse.next({ request });
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
