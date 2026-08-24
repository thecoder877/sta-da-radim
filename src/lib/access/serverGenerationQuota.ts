import { createHmac } from "node:crypto";

/**
 * Server-side backstop for the anonymous free-generation limit. The client
 * quota in `generationAccess.ts` drives the UX; this cookie stops a caller
 * from bypassing it by hitting `/api/trips/generate` directly. When
 * `APP_SECRET` is set the cookie value is HMAC-signed so it cannot be forged
 * by simply editing the count.
 */
export const ANON_QUOTA_COOKIE = "sdr_anon_gen";
export const FREE_ANONYMOUS_GENERATIONS = 1;
export const ANON_QUOTA_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function secret(): string | null {
  return process.env.APP_SECRET?.trim() || null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function encodeQuota(count: number): string {
  const payload = String(Math.max(0, Math.floor(count)));
  const key = secret();
  return key ? `${payload}.${sign(payload, key)}` : payload;
}

export function decodeQuota(raw: string | undefined | null): number {
  if (!raw) {
    return 0;
  }

  const key = secret();
  if (!key) {
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  }

  const [payload, signature] = raw.split(".");
  if (!payload || !signature || sign(payload, key) !== signature) {
    return 0;
  }
  const value = Number(payload);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}
