import { tripSuccessfullyGenerated } from "@/lib/access/generationAccess";
import type { PlanQuota, PlanQuotaReason } from "@/lib/access/planQuota";
import type { GeneratedTrip, TripRequest } from "@/types/trip";

export class GenerateTripError extends Error {
  code: string;
  resetsAt?: string;
  quota?: PlanQuota;

  constructor(message: string, code: string, extras?: { resetsAt?: string; quota?: PlanQuota }) {
    super(message);
    this.code = code;
    this.resetsAt = extras?.resetsAt;
    this.quota = extras?.quota;
  }
}

export async function requestGeneratedTrip(
  request: TripRequest,
  options?: { generationId?: string },
): Promise<GeneratedTrip> {
  const response = await fetch("/api/trips/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...request,
      generationId: options?.generationId,
    }),
  });
  const data = (await response.json()) as {
    trip?: GeneratedTrip;
    error?: string;
    code?: string;
    resetsAt?: string;
    quota?: PlanQuota;
  };

  if (!response.ok || !tripSuccessfullyGenerated(data.trip)) {
    throw new GenerateTripError(data.error ?? "GENERATE_FAILED", data.code ?? "GENERATE_FAILED", {
      resetsAt: data.resetsAt,
      quota: data.quota,
    });
  }

  return data.trip as GeneratedTrip;
}

export function isQuotaError(error: unknown): error is GenerateTripError & { code: PlanQuotaReason } {
  return (
    error instanceof GenerateTripError &&
    (error.code === "QUOTA_MONTH" || error.code === "QUOTA_EDITS")
  );
}
