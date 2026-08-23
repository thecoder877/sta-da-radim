"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(!configured);

  async function loadProfile() {
    const response = await fetch("/api/profile");
    if (!response.ok) {
      setProfile(null);
      return;
    }
    const data = (await response.json()) as { profile?: UserProfile | null };
    setProfile(data.profile ?? null);
  }

  async function refresh() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setUser(null);
      setProfile(null);
      setReady(true);
      return;
    }
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
    if (data.user) {
      await loadProfile();
    } else {
      setProfile(null);
    }
    setReady(true);
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void loadProfile();
      }
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadProfile();
      } else {
        setProfile(null);
      }
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      ready,
      configured,
      refresh,
      async signOut() {
        const supabase = createBrowserSupabaseClient();
        await supabase?.auth.signOut();
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
