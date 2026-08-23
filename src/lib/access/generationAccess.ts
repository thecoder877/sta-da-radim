/**
 * v0.2 anonymous quota lives in localStorage. That is not a security boundary.
 * Swap the store later for signed cookies, server-issued anonymous ids, or
 * account-tier quotas without changing UI call sites.
 */
export const ANONYMOUS_GENERATION_KEY = "stadardim_anonymous_generation";

export type GenerationAccessMode = "anonymous_free" | "authenticated";

export type GenerationAccess =
  | { allowed: true; mode: GenerationAccessMode }
  | { allowed: false; reason: "AUTH_REQUIRED" };

export interface AnonymousGenerationRecord {
  used: boolean;
  usedAt: string;
}

export interface GenerationAccessStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStore(): GenerationAccessStore | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function readAnonymousGeneration(
  store: GenerationAccessStore | null = browserStore(),
): AnonymousGenerationRecord | null {
  if (!store) {
    return null;
  }
  const raw = store.getItem(ANONYMOUS_GENERATION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AnonymousGenerationRecord;
    return parsed.used ? parsed : null;
  } catch {
    return null;
  }
}

export function hasUsedAnonymousGeneration(
  store: GenerationAccessStore | null = browserStore(),
): boolean {
  return Boolean(readAnonymousGeneration(store)?.used);
}

export function markAnonymousGenerationUsed(
  store: GenerationAccessStore | null = browserStore(),
  now = new Date(),
): void {
  if (!store) {
    return;
  }
  const record: AnonymousGenerationRecord = {
    used: true,
    usedAt: now.toISOString(),
  };
  store.setItem(ANONYMOUS_GENERATION_KEY, JSON.stringify(record));
}

export function getGenerationAccess(
  isAuthenticated: boolean,
  store: GenerationAccessStore | null = browserStore(),
): GenerationAccess {
  if (isAuthenticated) {
    return { allowed: true, mode: "authenticated" };
  }
  if (!hasUsedAnonymousGeneration(store)) {
    return { allowed: true, mode: "anonymous_free" };
  }
  return { allowed: false, reason: "AUTH_REQUIRED" };
}

export function requireGenerationAccess(
  isAuthenticated: boolean,
  store: GenerationAccessStore | null = browserStore(),
): GenerationAccess {
  return getGenerationAccess(isAuthenticated, store);
}

export function tripSuccessfullyGenerated(trip: {
  id?: string;
  daysPlan?: unknown[];
  stops?: unknown[];
} | null | undefined): boolean {
  return Boolean(trip?.id && trip.daysPlan && trip.daysPlan.length > 0 && trip.stops);
}
