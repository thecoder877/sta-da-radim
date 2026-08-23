"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SettingsForm() {
  const { profile, refresh } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, bio }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    setMessage(response.ok ? "Profil je sačuvan." : data.error ?? "Nije sačuvano.");
    if (response.ok) {
      await refresh();
    }
  }

  async function onAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
    if (response.ok) {
      await refresh();
      setMessage("Avatar je ažuriran.");
    } else {
      setMessage("Avatar nije otpremljen.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="settings-username">Korisničko ime</Label>
        <Input id="settings-username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="settings-name">Ime</Label>
        <Input id="settings-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="settings-bio">Bio</Label>
        <Textarea id="settings-bio" value={bio} onChange={(event) => setBio(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="settings-avatar">Avatar</Label>
        <Input id="settings-avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={onAvatar} />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={loading}>Sačuvaj</Button>
    </form>
  );
}
