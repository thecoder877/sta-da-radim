"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const TripMap = dynamic(
  () => import("@/components/map/TripMap").then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
        Učitavamo mapu...
      </div>
    ),
  },
);

export function TripMapLazy(props: ComponentProps<typeof TripMap>) {
  return <TripMap {...props} />;
}
