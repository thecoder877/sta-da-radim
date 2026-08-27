"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReviewRow {
  id: string;
  content: string;
  rating: number;
  status: string;
  place_key: string;
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("published");

  async function load(nextStatus = status, query = q) {
    const response = await fetch(
      `/api/admin/reviews?status=${nextStatus}&q=${encodeURIComponent(query)}`,
    );
    const data = (await response.json()) as { reviews?: ReviewRow[] };
    setItems(data.reviews ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "remove" | "restore") {
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Recenzije</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Pretraga"
          className="max-w-xs"
        />
        <select
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            void load(event.target.value);
          }}
        >
          <option value="published">Objavljene</option>
          <option value="removed">Uklonjene</option>
          <option value="hidden">Sakrivene</option>
        </select>
        <Button size="sm" onClick={() => void load()}>
          Traži
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8"
          >
            <p className="text-sm">
              {item.rating}★ · {item.place_key}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.content}</p>
            <div className="mt-3 flex gap-2">
              {item.status === "published" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void act(item.id, "remove")}
                >
                  Ukloni
                </Button>
              ) : (
                <Button size="sm" onClick={() => void act(item.id, "restore")}>
                  Vrati
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
