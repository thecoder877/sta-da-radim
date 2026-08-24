import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 font-heading text-3xl tracking-tight sm:text-4xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
