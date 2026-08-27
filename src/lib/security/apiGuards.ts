import { NextResponse } from "next/server";
import { getClientIp, rateLimit, type RateLimitOptions } from "@/lib/security/rateLimit";

/**
 * Enforce an IP-based rate limit for a public API route. Returns a 429
 * response when the caller is over budget, or null when the request may
 * proceed.
 */
export function rateLimitOrResponse(
  request: Request,
  name: string,
  options: RateLimitOptions,
): NextResponse | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${name}:${ip}`, options);
  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Previše zahteva. Pokušaj ponovo za koji trenutak.",
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
