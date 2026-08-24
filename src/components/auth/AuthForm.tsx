"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { HoneypotFields } from "@/components/security/HoneypotFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AuthFormMode = "login" | "register";

export function AuthForm({
  mode,
  onSuccess,
  onModeChange,
}: {
  mode: AuthFormMode;
  onSuccess?: () => void;
  onModeChange?: (mode: AuthFormMode) => void;
}) {
  const { refresh } = useAuth();
  const startedAt = useMemo(() => Date.now(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || password.length < 6) {
      setError("Unesi ispravan email i lozinku od najmanje 6 karaktera.");
      return;
    }
    if (mode === "register" && !/^[a-z0-9_]{3,30}$/.test(username.trim().toLowerCase())) {
      setError("Korisničko ime: 3–30 karaktera, slova, brojevi i donja crta.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          username: username.trim().toLowerCase() || undefined,
          displayName: displayName.trim() || undefined,
          company,
          startedAt,
        }),
      });
      const data = (await response.json()) as { error?: string; needsConfirm?: boolean };
      if (!response.ok) {
        setError(data.error ?? "Prijava trenutno nije dostupna.");
        return;
      }
      if (data.needsConfirm) {
        setInfo("Nalog je uspešno napravljen. Proveri email da potvrdiš adresu, pa se prijavi.");
        return;
      }
      await refresh();
      setInfo(mode === "register" ? "Nalog je uspešno napravljen." : null);
      onSuccess?.();
    } catch {
      setError("Prijava trenutno nije dostupna.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="relative space-y-4">
      <HoneypotFields startedAt={startedAt} />
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
      />
      {mode === "register" ? (
        <div className="space-y-1.5">
          <Label htmlFor="auth-username">Korisničko ime</Label>
          <Input
            id="auth-username"
            autoComplete="username"
            className="h-11"
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            placeholder="npr. njegos"
            required
          />
        </div>
      ) : null}
      {mode === "register" ? (
        <div className="space-y-1.5">
          <Label htmlFor="auth-name">Ime (opciono)</Label>
          <Input
            id="auth-name"
            autoComplete="name"
            className="h-11"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          className="h-11"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="auth-password">Lozinka</Label>
        <Input
          id="auth-password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="h-11"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
      <Button type="submit" className="h-11 w-full" disabled={loading}>
        {loading ? "Sačekaj..." : mode === "login" ? "Prijavi se" : "Napravi nalog"}
      </Button>
      {onModeChange ? (
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Nemaš nalog?" : "Već imaš nalog?"}{" "}
          <button
            type="button"
            className="text-foreground underline"
            onClick={() => onModeChange(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Registruj se" : "Prijavi se"}
          </button>
        </p>
      ) : null}
    </form>
  );
}
