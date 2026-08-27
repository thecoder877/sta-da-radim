"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompleteUsername() {
  const pathname = usePathname();
  const { user, profile, ready, refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!ready || !user || profile?.username || pathname?.startsWith("/admin")) {
    return null;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Korisničko ime nije sačuvano.");
      return;
    }
    await refresh();
  }

  return (
    <div className="border-b border-border bg-card px-4 py-4">
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <p className="font-heading text-lg">Još samo jedan korak</p>
          <p className="text-sm text-muted-foreground">
            Odaberi korisničko ime. Email ostaje privatan.
          </p>
          <Label htmlFor="complete-username" className="sr-only">
            Korisničko ime
          </Label>
          <Input
            id="complete-username"
            className="mt-2 h-10"
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            placeholder="npr. marko92"
            required
          />
          {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" disabled={loading}>
          Sačuvaj
        </Button>
      </form>
    </div>
  );
}
