"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError("Supabase nije podešen. Dodaj URL i anon ključ u .env.local.");
      return;
    }

    if (!email.trim() || password.length < 6) {
      setError("Unesi ispravan email i lozinku od najmanje 6 karaktera.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError("Pogrešan email ili lozinka.");
          return;
        }
        onSuccess?.();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim() || undefined,
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message.includes("already") ? "Ovaj email je već registrovan." : "Nalog nije napravljen. Pokušaj ponovo.");
        return;
      }
      if (!data.session) {
        setInfo("Nalog je uspešno napravljen. Proveri email da potvrdiš adresu, pa se prijavi.");
        return;
      }
      setInfo("Nalog je uspešno napravljen.");
      onSuccess?.();
    } catch {
      setError("Prijava trenutno nije dostupna.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" ? (
        <div className="space-y-1.5">
          <Label htmlFor="auth-name">Ime</Label>
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
