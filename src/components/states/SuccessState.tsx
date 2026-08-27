import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export function SuccessState({
  title = "Uspešno",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="motion-enter rounded-2xl border border-primary/25 bg-primary/5 px-6 py-8 text-center"
    >
      <CheckCircle2 className="mx-auto mb-3 size-6 text-primary" aria-hidden />
      <p className="font-heading text-xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
