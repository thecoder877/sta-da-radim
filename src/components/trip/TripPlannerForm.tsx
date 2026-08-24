"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { format } from "date-fns";
import {
  BUDGET_OPTIONS,
  DISTANCE_OPTIONS,
  DURATION_OPTIONS,
  GENERATION_MESSAGES,
  TRAVEL_STYLE_OPTIONS,
} from "@/lib/constants";
import { resolveStartCoordinates } from "@/lib/locations";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import {
  getGenerationAccess,
  hasUsedAnonymousGeneration,
  markAnonymousGenerationUsed,
  tripSuccessfullyGenerated,
} from "@/lib/access/generationAccess";
import { canStartGeneration, type PlanQuotaReason } from "@/lib/access/planQuota";
import { QuotaLockedDialog } from "@/components/access/QuotaLockedDialog";
import { isQuotaError, requestGeneratedTrip } from "@/lib/trips/generateClient";
import { persistGeneratedTrip, persistLastTripRequest, readLastTripRequest } from "@/lib/trips/storage";
import { tripRequestSchema } from "@/lib/validation/trip";
import type { DurationPreset, TransportType, TravelStyle, TripRequest } from "@/types/trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BudgetSelector } from "@/components/trip/BudgetSelector";
import { InterestSelector } from "@/components/trip/InterestSelector";
import { StartLocationField } from "@/components/trip/StartLocationField";
import { TransportSelector } from "@/components/trip/TransportSelector";
import { TripGeneratingOverlay } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";

type FormValues = {
  startName: string;
  startLatitude?: number;
  startLongitude?: number;
  startDate: string;
  durationPreset: DurationPreset;
  numberOfPeople: number;
  budgetPreset: string;
  customBudget: string;
  transport: TransportType;
  maxDistance: string;
  interests: string[];
  travelStyle: TravelStyle;
  additionalPreferences: string;
};

function formValuesFromRequest(request: TripRequest): FormValues {
  const duration = DURATION_OPTIONS.some((item) => item.id === request.durationPreset)
    ? (request.durationPreset as DurationPreset)
    : (DURATION_OPTIONS.find((item) => item.days === request.days)?.id ?? "1");
  const budgetMatch = BUDGET_OPTIONS.find(
    (item) => typeof item.value === "number" && item.value === request.budget,
  );
  const distanceMatch = DISTANCE_OPTIONS.find((item) => item.value === request.maxDistanceKm);

  return {
    startName: request.startLocation.name,
    startLatitude: request.startLocation.coordinates?.latitude,
    startLongitude: request.startLocation.coordinates?.longitude,
    startDate: request.startDate,
    durationPreset: duration,
    numberOfPeople: request.numberOfPeople,
    budgetPreset: budgetMatch?.id ?? (request.budget ? "custom" : "unlimited"),
    customBudget: !budgetMatch && request.budget ? String(request.budget) : "",
    transport: request.transport,
    maxDistance: distanceMatch?.id ?? "any",
    interests: request.interests,
    travelStyle: request.travelStyle,
    additionalPreferences: request.additionalPreferences ?? "",
  };
}

function defaultValues(searchParams: URLSearchParams): FormValues {
  const duration = searchParams.get("duration");
  const preset = DURATION_OPTIONS.some((item) => item.id === duration)
    ? (duration as DurationPreset)
    : "1";

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  return {
    startName: searchParams.get("from") ?? "",
    startLatitude: Number.isFinite(lat) ? lat : undefined,
    startLongitude: Number.isFinite(lng) ? lng : undefined,
    startDate: searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd"),
    durationPreset: preset,
    numberOfPeople: 2,
    budgetPreset: "10000",
    customBudget: "",
    transport: "car",
    maxDistance: "100",
    interests: ["priroda", "istorija", "restorani"],
    travelStyle: "balanced",
    additionalPreferences: "",
  };
}

export function TripPlannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, quota, refresh } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [quotaReason, setQuotaReason] = useState<PlanQuotaReason | null>(null);

  const form = useForm<FormValues>({
    defaultValues: defaultValues(searchParams),
  });
  const transport = useWatch({ control: form.control, name: "transport" });
  const previousTransport = useRef(transport);

  useEffect(() => {
    if (previousTransport.current === transport) {
      return;
    }
    previousTransport.current = transport;
    const current = form.getValues("maxDistance");
    if (transport === "walk" && ["100", "150", "250", "any"].includes(current)) {
      form.setValue("maxDistance", "25");
    }
    if (transport === "bike" && ["150", "250", "any"].includes(current)) {
      form.setValue("maxDistance", "50");
    }
  }, [form, transport]);

  useEffect(() => {
    if (searchParams.get("from") || searchParams.get("date") || searchParams.get("duration")) {
      return;
    }
    const lastRequest = readLastTripRequest();
    if (lastRequest) {
      form.reset(formValuesFromRequest(lastRequest));
    }
  }, [form, searchParams]);

  useEffect(() => {
    if (!loading) {
      return;
    }
    const timer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % GENERATION_MESSAGES.length);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function onSubmit(values: FormValues) {
    setError(null);
    const duration = DURATION_OPTIONS.find((item) => item.id === values.durationPreset);
    const budgetOption = BUDGET_OPTIONS.find((item) => item.id === values.budgetPreset);
    const customBudget = Number(values.customBudget.replace(/\D/g, ""));
    const budget =
      values.budgetPreset === "unlimited"
        ? undefined
        : values.budgetPreset === "custom"
          ? customBudget || undefined
          : typeof budgetOption?.value === "number"
            ? budgetOption.value
            : undefined;

    const payload = {
      startLocation: {
        name: values.startName,
        coordinates:
          values.startLatitude !== undefined && values.startLongitude !== undefined
            ? {
                latitude: values.startLatitude,
                longitude: values.startLongitude,
              }
            : resolveStartCoordinates(values.startName),
      },
      startDate: values.startDate,
      days: duration?.days ?? 1,
      durationPreset: values.durationPreset,
      numberOfPeople: Number(values.numberOfPeople),
      budget,
      transport: values.transport,
      maxDistanceKm:
        values.maxDistance === "any" ? undefined : Number(values.maxDistance),
      interests: values.interests,
      travelStyle: values.travelStyle,
      additionalPreferences: values.additionalPreferences || undefined,
    };

    const parsed = tripRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Proveri uneta polja.";
      setError(first);
      return;
    }

    persistLastTripRequest(parsed.data);
    const access = getGenerationAccess(Boolean(user));
    if (!access.allowed) {
      openAuthModal({
        reason: "generation_limit",
        pendingAction: { type: "generate", request: parsed.data },
      });
      return;
    }
    if (user && quota && !canStartGeneration(quota)) {
      setQuotaReason("QUOTA_MONTH");
      return;
    }

    setLoading(true);
    try {
      const trip = await requestGeneratedTrip(parsed.data);
      if (!tripSuccessfullyGenerated(trip)) {
        setError("GENERATE_FAILED");
        return;
      }

      persistGeneratedTrip(trip);
      if (access.mode === "anonymous_free") {
        markAnonymousGenerationUsed();
      }
      if (user) {
        await refresh();
      }
      router.push(`/trip/${trip.id}`);
    } catch (generateError) {
      if (isQuotaError(generateError)) {
        setQuotaReason(generateError.code);
        await refresh();
        return;
      }
      const code = (generateError as Error & { code?: string }).code;
      if (code === "NOT_ENOUGH_PLACES") {
        setError("NOT_ENOUGH_PLACES");
      } else {
        setError("GENERATE_FAILED");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <TripGeneratingOverlay message={GENERATION_MESSAGES[messageIndex]} />
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Controller
          control={form.control}
          name="startName"
          rules={{ required: true }}
          render={({ field }) => (
            <StartLocationField
              value={field.value}
              autoDetect={!searchParams.get("from")}
              onChange={(name, coordinates) => {
                field.onChange(name);
                form.setValue("startLatitude", coordinates?.latitude);
                form.setValue("startLongitude", coordinates?.longitude);
              }}
              error={form.formState.errors.startName?.message}
            />
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Kada ideš?</Label>
            <Input
              id="startDate"
              type="date"
              className="h-11"
              {...form.register("startDate")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="people">Koliko vas ide?</Label>
            <Input
              id="people"
              type="number"
              min={1}
              max={20}
              className="h-11"
              {...form.register("numberOfPeople", { valueAsNumber: true })}
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Koliko dugo?</legend>
          <Controller
            control={form.control}
            name="durationPreset"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => field.onChange(option.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      field.value === option.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Koliki ti je budžet?</legend>
          <p className="text-xs text-muted-foreground">
            Budžet je opcion. Sve cene u planu su procena, ne tačan račun.
          </p>
          <BudgetFields control={form.control} setValue={form.setValue} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Kako putuješ?</legend>
          <Controller
            control={form.control}
            name="transport"
            render={({ field }) => (
              <TransportSelector value={field.value} onChange={field.onChange} />
            )}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Maksimalna udaljenost</legend>
          <p className="text-xs text-muted-foreground">
            {transport === "walk"
              ? "Hod se računa ~4,5 km/h. 350 km je više dana hoda, ne 6 sati — zato biramo mesta koja se stignu peške."
              : transport === "bike"
                ? "Bicikl se računa ~14 km/h, ne automobilskim vremenom."
                : "Koliko daleko od starta smeju biti stanice."}
          </p>
          <Controller
            control={form.control}
            name="maxDistance"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {DISTANCE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => field.onChange(option.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      field.value === option.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Šta te zanima?</legend>
          <Controller
            control={form.control}
            name="interests"
            render={({ field }) => (
              <InterestSelector value={field.value} onChange={field.onChange} />
            )}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Ritam putovanja</legend>
          <Controller
            control={form.control}
            name="travelStyle"
            render={({ field }) => (
              <div className="grid gap-3 md:grid-cols-3">
                {TRAVEL_STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => field.onChange(option.id)}
                    className={`rounded-2xl border p-4 text-left ${
                      field.value === option.id
                        ? "border-primary bg-primary/8"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          />
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Još nešto što bi trebalo da znamo?</Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder="Ne želim previše pešačenja i voleo bih neki dobar restoran."
            {...form.register("additionalPreferences")}
          />
        </div>

        {error === "NOT_ENOUGH_PLACES" ? (
          <ErrorState
            title="Nismo pronašli dovoljno mesta za ove kriterijume."
            description="Pokušaj da povećaš maksimalnu udaljenost, povećaš budžet ili odabereš još interesovanja."
          />
        ) : null}

        {error === "GENERATE_FAILED" ? (
          <ErrorState
            title="Plan nije spreman"
            description="Trenutno nismo uspeli da napravimo plan. Pokušaj ponovo."
          />
        ) : null}

        {error && error !== "NOT_ENOUGH_PLACES" && error !== "GENERATE_FAILED" ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <div className="space-y-2">
          <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
            Napravi mi plan
          </Button>
          {!user && !hasUsedAnonymousGeneration() ? (
            <p className="text-center text-xs text-muted-foreground">
              Prvi plan možeš da napraviš bez naloga.
            </p>
          ) : null}
          {!user && hasUsedAnonymousGeneration() ? (
            <p className="text-center text-xs text-muted-foreground">
              Napravi nalog da menjaš ovaj plan ili napraviš novi.
            </p>
          ) : null}
          {user && quota && !quota.unlimited ? (
            <p className="text-center text-xs text-muted-foreground">
              {quota.generationsRemaining}/{quota.generationsLimit} generisanja ostalo ovog meseca
            </p>
          ) : null}
        </div>
      </form>

      <QuotaLockedDialog
        open={quotaReason !== null}
        onOpenChange={(open) => {
          if (!open) {
            setQuotaReason(null);
          }
        }}
        reason={quotaReason ?? "QUOTA_MONTH"}
        quota={quota}
      />
    </>
  );
}

function BudgetFields({
  control,
  setValue,
}: {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}) {
  const budgetPreset = useWatch({ control, name: "budgetPreset" });
  const customBudget = useWatch({ control, name: "customBudget" });

  return (
    <BudgetSelector
      preset={budgetPreset}
      customValue={customBudget}
      onPresetChange={(value) => setValue("budgetPreset", value)}
      onCustomChange={(value) => setValue("customBudget", value)}
    />
  );
}
