"use client";

import { INTERESTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function InterestSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {INTERESTS.map((interest) => {
        const selected = value.includes(interest.id);
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => toggle(interest.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {interest.label}
          </button>
        );
      })}
    </div>
  );
}
