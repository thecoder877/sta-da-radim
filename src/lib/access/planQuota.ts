export const MONTHLY_GENERATIONS = 3;
export const EDITS_PER_GENERATION = 3;
export const QUOTA_TIMEZONE = "Europe/Belgrade";

export type PlanQuotaReason = "QUOTA_MONTH" | "QUOTA_EDITS";

export interface PlanQuota {
  unlimited: boolean;
  generationsUsed: number;
  generationsLimit: number;
  generationsRemaining: number;
  editsLimit: number;
  resetsAt: string;
}

export interface QuotaDecision {
  ok: boolean;
  reason?: PlanQuotaReason;
  generationId?: string;
  editCount?: number;
  editsRemaining?: number;
  quota: PlanQuota;
}

export function monthKey(date = new Date(), timeZone = QUOTA_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

export function monthStartUtc(date = new Date(), timeZone = QUOTA_TIMEZONE): Date {
  const [year, month] = monthKey(date, timeZone).split("-").map(Number);
  return belgradeWallTime(year, month, 1);
}

export function nextMonthResetAt(date = new Date(), timeZone = QUOTA_TIMEZONE): Date {
  const [year, month] = monthKey(date, timeZone).split("-").map(Number);
  if (month === 12) {
    return belgradeWallTime(year + 1, 1, 1);
  }
  return belgradeWallTime(year, month + 1, 1);
}

function belgradeWallTime(year: number, month: number, day: number): Date {
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00`;
  const asUtc = new Date(`${iso}Z`);
  const shown = new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(asUtc);
  const hour = Number(shown.find((part) => part.type === "hour")?.value ?? "0");
  return new Date(asUtc.getTime() - hour * 60 * 60 * 1000);
}

export function emptyQuota(unlimited: boolean, now = new Date()): PlanQuota {
  return {
    unlimited,
    generationsUsed: unlimited ? 0 : 0,
    generationsLimit: MONTHLY_GENERATIONS,
    generationsRemaining: unlimited ? MONTHLY_GENERATIONS : MONTHLY_GENERATIONS,
    editsLimit: EDITS_PER_GENERATION,
    resetsAt: nextMonthResetAt(now).toISOString(),
  };
}

export function quotaFromUsage(
  generationsUsed: number,
  unlimited: boolean,
  now = new Date(),
): PlanQuota {
  const used = Math.max(0, generationsUsed);
  return {
    unlimited,
    generationsUsed: unlimited ? used : used,
    generationsLimit: MONTHLY_GENERATIONS,
    generationsRemaining: unlimited
      ? MONTHLY_GENERATIONS
      : Math.max(0, MONTHLY_GENERATIONS - used),
    editsLimit: EDITS_PER_GENERATION,
    resetsAt: nextMonthResetAt(now).toISOString(),
  };
}

export function canStartGeneration(quota: PlanQuota): boolean {
  return quota.unlimited || quota.generationsRemaining > 0;
}

export function canEditGeneration(editCount: number, unlimited: boolean): boolean {
  return unlimited || editCount < EDITS_PER_GENERATION;
}

export function formatQuotaCountdown(resetsAt: string, now = new Date()): string {
  const remaining = Math.max(0, new Date(resetsAt).getTime() - now.getTime());
  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `${days} ${days === 1 ? "dan" : "dana"} ${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
