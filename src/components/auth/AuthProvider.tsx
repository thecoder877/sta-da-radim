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
import { authFetchSignal } from "@/lib/http/authFetch";
import { fetchAuthMe, type AuthMeResponse } from "@/lib/http/fetchAuthMe";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  quota: PlanQuota | null;
  ready: boolean;
  configured: boolean;
  refresh: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  quota: null,
  ready: false,
  configured: false,
  refresh: async () => false,
  signOut: async () => undefined,
});

function asUser(id: string): User {
  return { id } as User;
}

function readSession(data: AuthMeResponse | null): {
  user: User | null;
  profile: UserProfile | null;
  quota: PlanQuota | null;
} {
  if (!data?.user?.id) {
    return { user: null, profile: null, quota: null };
  }
  return {
    user: asUser(data.user.id),
    profile: data.profile ?? null,
    quota: data.quota ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<PlanQuota | null>(null);
  const [ready, setReady] = useState(!configured);

  const applyLoggedOut = useCallback(() => {
    setUser(null);
    setProfile(null);
    setQuota(null);
    setReady(true);
  }, []);

  const applySession = useCallback((data: AuthMeResponse | null) => {
    const session = readSession(data);
    setUser(session.user);
    setProfile(session.profile);
    setQuota(session.quota);
    setReady(true);
    return Boolean(session.user);
  }, []);

  const refresh = useCallback(async () => {
    if (!configured) {
      applyLoggedOut();
      return false;
    }
    try {
      return applySession(await fetchAuthMe());
    } catch (error) {
      console.error("Učitavanje sesije nije uspelo.", error);
      setReady(true);
      return false;
    }
  }, [applyLoggedOut, applySession, configured]);

  useEffect(() => {
    if (!configured) {
      return;
    }
    let cancelled = false;
    void fetchAuthMe()
      .then((data) => {
        if (!cancelled) {
          applySession(data);
        }
      })
      .catch((error) => {
        console.error("Učitavanje sesije nije uspelo.", error);
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      quota,
      ready,
      configured,
      refresh,
      async signOut() {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          signal: authFetchSignal(),
        }).catch((error) => {
          console.error("Odjava nije uspela.", error);
        });
        applyLoggedOut();
      },
    }),
    [user, profile, quota, ready, configured, refresh, applyLoggedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
