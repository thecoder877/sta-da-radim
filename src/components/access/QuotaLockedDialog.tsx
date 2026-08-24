"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { formatQuotaCountdown, type PlanQuota, type PlanQuotaReason } from "@/lib/access/planQuota";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuotaLockedDialog({
  open,
  onOpenChange,
  reason,
  quota,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: PlanQuotaReason;
  quota?: PlanQuota | null;
}) {
  const resetsAt = quota?.resetsAt ?? new Date(Date.now() + 86_400_000).toISOString();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  const title =
    reason === "QUOTA_EDITS" ? "Iskoristio si izmene ovog plana" : "Mesečni limit je popunjen";
  const description =
    reason === "QUOTA_EDITS"
      ? "Svaki plan možeš da izmeniš tri puta. Novi planovi i izmene se otvaraju početkom sledećeg meseca, ili odmah sa Plus nalogom."
      : "Besplatan nalog ima 3 generisanja mesečno. Limit se resetuje početkom sledećeg meseca, ili odmah ako nadogradiš nalog.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-muted/70 px-4 py-5 text-center">
          <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            Novi planovi za
          </p>
          <p className="mt-2 font-heading text-3xl tabular-nums">
            {formatQuotaCountdown(resetsAt, now)}
          </p>
          {quota && !quota.unlimited ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {quota.generationsUsed}/{quota.generationsLimit} generisanja ovog meseca
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" render={<Link href="/saved" />} onClick={() => onOpenChange(false)}>
            Sačuvani planovi
          </Button>
          <Button render={<Link href="/upgrade" />} onClick={() => onOpenChange(false)}>
            Nadogradi nalog
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
