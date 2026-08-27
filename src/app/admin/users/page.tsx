"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

interface UserRow {
  id: string;
  username: string | null;
  display_name: string | null;
  role: string;
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  async function load(query = q) {
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const data = (await response.json()) as { users?: UserRow[] };
    setItems(data.users ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
      .then((response) => response.json())
      .then((data: { users?: UserRow[] }) => {
        if (cancelled) {
          return;
        }
        setItems(data.users ?? []);
      });
    return () => {
      cancelled = true;
    };
    // Initial list only; later loads come from the search action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="font-heading text-3xl">Korisnici</h1>
      <div className="mt-4 flex gap-2">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Pretraga po imenu"
          className="max-w-xs"
        />
        <button type="button" className="text-sm underline" onClick={() => void load()}>
          Traži
        </button>
      </div>
      <ul className="mt-6 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/8"
          >
            {item.display_name || item.username || "Korisnik"}
            {item.username ? ` · @${item.username}` : ""}
            {item.role === "admin" ? " · admin" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
