"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  ready: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  ready: false,
  configured: false,
  refresh: async () => undefined,
  signOut: async () => undefined,
});

function asUser(id: string): User {
  return { id } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(!configured);

  async function refresh() {
    if (!configured) {
      setUser(null);
      setProfile(null);
      setReady(true);
      return;
    }
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      setUser(null);
      setProfile(null);
      setReady(true);
      return;
    }
    const data = (await response.json()) as { user?: { id: string } | null; profile?: UserProfile | null };
    setUser(data.user?.id ? asUser(data.user.id) : null);
    setProfile(data.profile ?? null);
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      ready,
      configured,
      refresh,
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        setProfile(null);
      },
    }),
    [user, profile, ready, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
