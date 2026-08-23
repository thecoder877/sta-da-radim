"use client";

import { useEffect, useState } from "react";
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
import { persistGeneratedTrip } from "@/lib/trips/storage";
import { tripRequestSchema } from "@/lib/validation/trip";
import type { DurationPreset, TransportType, TravelStyle } from "@/types/trip";
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

function defaultValues(searchParams: URLSearchParams): FormValues {
  const duration = searchParams.get("duration");
  const preset = DURATION_OPTIONS.some((item) => item.id === duration)
    ? (duration as DurationPreset)
    : "1";

  return {
    startName: searchParams.get("from") ?? "Ruma",
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
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    defaultValues: defaultValues(searchParams),
  });

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
        coordinates: resolveStartCoordinates(values.startName),
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

    setLoading(true);
    try {
      const response = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as {
        trip?: import("@/types/trip").GeneratedTrip;
        error?: string;
        code?: string;
      };

      if (!response.ok || !data.trip) {
        if (data.code === "NOT_ENOUGH_PLACES") {
          setError("NOT_ENOUGH_PLACES");
        } else {
          setError(data.error ?? "GENERATE_FAILED");
        }
        return;
      }

      persistGeneratedTrip(data.trip);
      router.push(`/trip/${data.trip.id}`);
    } catch {
      setError("GENERATE_FAILED");
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
              onChange={field.onChange}
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

        <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
          Napravi mi plan
        </Button>
      </form>
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
