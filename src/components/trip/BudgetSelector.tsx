"use client";

import { BUDGET_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function BudgetSelector({
  preset,
  customValue,
  onPresetChange,
  onCustomChange,
}: {
  preset: string;
  customValue: string;
  onPresetChange: (preset: string) => void;
  onCustomChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BUDGET_OPTIONS.map((option) => {
          const selected = preset === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPresetChange(option.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {preset === "custom" ? (
        <div>
          <Input
            inputMode="numeric"
            value={customValue}
            onChange={(event) => onCustomChange(event.target.value)}
            placeholder="npr. 7500"
            className="h-10 max-w-xs"
            aria-label="Budžet u dinarima"
          />
          <p className="mt-1 text-xs text-muted-foreground">Iznos u RSD, za celu grupu.</p>
        </div>
      ) : null}
    </div>
  );
}
