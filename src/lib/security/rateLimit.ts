export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

type LegacyRateLimitOk = { ok: true; remaining: number };
type LegacyRateLimitBlocked = { ok: false; retryAfterSec: number };

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Best-effort, in-memory fixed-window rate limiter. It protects a single
 * warm server instance from being used as an open proxy for the public
 * OSM/OSRM/Google backends. It is not shared across serverless instances,
 * so treat it as defense-in-depth rather than a hard guarantee.
 */
const buckets = new Map<string, Bucket>();

function sweep(now: number): void {
  if (buckets.size < 5000) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function take(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): RateLimitResult {
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** GitHub/proxy call sites: `rateLimit(key, limit, windowMs)` returning `{ ok }`. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): LegacyRateLimitOk | LegacyRateLimitBlocked;
/** Vitest/apiGuards call sites: `rateLimit(key, { limit, windowMs }, now?)`. */
export function rateLimit(
  key: string,
  options: RateLimitOptions,
  now?: number,
): RateLimitResult;
export function rateLimit(
  key: string,
  limitOrOptions: number | RateLimitOptions,
  windowMsOrNow?: number,
): LegacyRateLimitOk | LegacyRateLimitBlocked | RateLimitResult {
  if (typeof limitOrOptions === "number") {
    const result = take(key, limitOrOptions, windowMsOrNow ?? 60_000, Date.now());
    if (result.allowed) {
      return { ok: true, remaining: result.remaining };
    }
    return { ok: false, retryAfterSec: result.retryAfterSeconds };
  }

  return take(
    key,
    limitOrOptions.limit,
    limitOrOptions.windowMs,
    windowMsOrNow ?? Date.now(),
  );
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export const getClientIp = clientIp;

export function limitResponse(retryAfterSec: number) {
  return Response.json(
    { error: "Previše pokušaja. Sačekaj malo.", code: "RATE_LIMITED" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

/** Test-only helper to reset the shared window state between cases. */
export function resetRateLimits(): void {
  buckets.clear();
}
