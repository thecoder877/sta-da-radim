"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { PlanQuota } from "@/lib/access/planQuota";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  quota: PlanQuota | null;
  ready: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  quota: null,
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
  const [quota, setQuota] = useState<PlanQuota | null>(null);
  const [ready, setReady] = useState(!configured);

  async function refresh() {
    if (!configured) {
      setUser(null);
      setProfile(null);
      setQuota(null);
      setReady(true);
      return;
    }
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      setUser(null);
      setProfile(null);
      setQuota(null);
      setReady(true);
      return;
    }
    const data = (await response.json()) as {
      user?: { id: string } | null;
      profile?: UserProfile | null;
      quota?: PlanQuota | null;
    };
    setUser(data.user?.id ? asUser(data.user.id) : null);
    setProfile(data.profile ?? null);
    setQuota(data.quota ?? null);
    setReady(true);
  }

  useEffect(() => {
    void refresh();
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      quota,
      ready,
      configured,
      refresh,
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        setProfile(null);
        setQuota(null);
      },
    }),
    [user, profile, quota, ready, configured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
