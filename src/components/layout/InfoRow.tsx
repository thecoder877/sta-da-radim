import type { ReactNode } from "react";

export function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-start gap-3 border-b border-border py-3 last:border-b-0 sm:grid-cols-[9rem_1fr]">
      <dt className="pt-0.5 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-6">
        {value ? <span className="font-medium">{value}</span> : (
          <span className="text-muted-foreground">Nije poznato</span>
        )}
        {action ? <span className="ml-2">{action}</span> : null}
      </dd>
    </div>
  );
}
