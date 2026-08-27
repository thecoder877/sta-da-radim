"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Floating "back to top" button that appears after scrolling down. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Nazad na vrh"
      title="Nazad na vrh"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-[transform,background-color,opacity] duration-[160ms] ease-out-emph starting:scale-95 starting:opacity-0 hover:bg-muted active:scale-[0.97] print:hidden"
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
