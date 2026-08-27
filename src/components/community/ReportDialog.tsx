"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/community/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "review" | "reply" | "photo" | "place";
  targetId: string;
  onSubmitted?: () => void;
}) {
  const [reason, setReason] = useState("other");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        reason,
        details: details || undefined,
      }),
    });
    setLoading(false);
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "Prijava nije poslata.");
      return;
    }
    onOpenChange(false);
    onSubmitted?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prijavi sadržaj</DialogTitle>
          <DialogDescription>
            Prijava ide moderatoru. Sadržaj ostaje vidljiv dok se ne odluči.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="report-reason">Razlog</Label>
            <select
              id="report-reason"
              className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              {REPORT_REASONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">Detalji (opciono)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
            />
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <Button type="submit" disabled={loading}>
            Pošalji prijavu
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
