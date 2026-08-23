"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
}

export default function AdminReportsPage() {
  const [items, setItems] = useState<ReportRow[]>([]);

  async function load() {
    const response = await fetch("/api/admin/reports");
    const data = (await response.json()) as { reports?: ReportRow[] };
    setItems(data.reports ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "resolve" | "dismiss") {
    await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Prijave</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
            <p className="text-sm font-medium">{item.target_type} · {item.reason} · {item.status}</p>
            <p className="text-xs text-muted-foreground">{item.target_id}</p>
            {item.details ? <p className="mt-2 text-sm">{item.details}</p> : null}
            {item.status === "open" ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void act(item.id, "resolve")}>Reši</Button>
                <Button size="sm" variant="outline" onClick={() => void act(item.id, "dismiss")}>Odbaci</Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
