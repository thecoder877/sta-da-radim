"use client";

import { useEffect, useState } from "react";

/** Thin progress bar at the very top that tracks page scroll. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(1, scrollTop / height) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent print:hidden"
      aria-hidden
    >
      <div
        className="h-full w-full origin-left bg-primary"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
