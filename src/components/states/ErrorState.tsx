import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export function ErrorState({
  title = "Nešto nije u redu",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-card px-6 py-10 text-center">
      <AlertCircle className="mx-auto mb-3 size-6 text-destructive" aria-hidden />
      <h2 className="font-heading text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
