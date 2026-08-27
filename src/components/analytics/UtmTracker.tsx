"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/analytics/utm";

/** Captures first-touch UTM params on load. Renders nothing. */
export function UtmTracker() {
  useEffect(() => {
    captureUtmParams();
  }, []);
  return null;
}
