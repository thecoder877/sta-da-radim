"use client";

import { Mail } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/constants";

/** Floating contact button (bottom-left, to avoid the back-to-top button). */
export function FloatingContact() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      aria-label="Kontaktiraj nas"
      title="Kontakt"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90 print:hidden"
    >
      <Mail className="size-4" aria-hidden />
      <span className="hidden sm:inline">Kontakt</span>
    </a>
  );
}
