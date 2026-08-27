"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "sdr_cookie_consent";

/** Minimal cookie/consent banner; the choice is stored in localStorage. */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CONSENT_KEY)) {
        // One-time check on mount; localStorage is client-only.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // localStorage may be unavailable (private mode); skip the banner.
    }
  }, []);

  function resolve(choice: "accepted" | "declined") {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // ignore write failures
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Obaveštenje o kolačićima"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-2xl rounded-2xl border border-border bg-card p-4 shadow-lg transition-[opacity,transform] duration-[250ms] ease-out-emph starting:translate-y-4 starting:opacity-0 print:hidden sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto sm:w-96"
    >
      <p className="text-sm leading-6 text-muted-foreground">
        Koristimo neophodne kolačiće da bi sajt radio (npr. prijava i besplatni plan).
        Nema reklamnog praćenja.
      </p>
      <div className="mt-3 flex gap-2">
        <Button className="h-9 flex-1" onClick={() => resolve("accepted")}>
          Prihvatam
        </Button>
        <Button
          variant="outline"
          className="h-9 flex-1"
          onClick={() => resolve("declined")}
        >
          Samo neophodni
        </Button>
      </div>
    </div>
  );
}
