"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const LocationPicker = dynamic(
  () => import("@/components/community/LocationPicker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-[#e7efe4] text-sm text-muted-foreground ring-1 ring-foreground/10">
        Učitavamo mapu...
      </div>
    ),
  },
);

export function LocationPickerLazy(props: ComponentProps<typeof LocationPicker>) {
  return <LocationPicker {...props} />;
}
