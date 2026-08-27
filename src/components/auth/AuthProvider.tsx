"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  const refresh = useCallback(async () => {
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
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      return;
    }
    let cancelled = false;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) {
          return;
        }
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
        if (cancelled) {
          return;
        }
        setUser(data.user?.id ? asUser(data.user.id) : null);
        setProfile(data.profile ?? null);
        setQuota(data.quota ?? null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setProfile(null);
          setQuota(null);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
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
    [user, profile, quota, ready, configured, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
