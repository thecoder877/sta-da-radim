"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthForm, type AuthFormMode } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  setPendingProtectedAction,
  type AuthModalReason,
  type PendingProtectedAction,
} from "@/lib/access/pendingAction";
import { resumePendingProtectedAction } from "@/lib/access/resumePendingAction";

interface AuthModalContextValue {
  openAuthModal: (options: {
    reason: AuthModalReason;
    pendingAction?: PendingProtectedAction;
    initialMode?: AuthFormMode;
  }) => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  openAuthModal: () => undefined,
});

const COPY: Record<AuthModalReason, { title: string; description: string }> = {
  generation_limit: {
    title: "Želiš još planova?",
    description:
      "Prvi plan možeš da napraviš bez naloga. Napravi besplatan nalog da generišeš nove planove, menjaš postojeće i sačuvaš svoja putovanja.",
  },
  save_trip: {
    title: "Sačuvaj svoj plan",
    description: "Prijavi se ili napravi nalog da sačuvaš putovanje i pristupiš mu kasnije.",
  },
  protected_action: {
    title: "Želiš još planova?",
    description:
      "Prvi plan možeš da napraviš bez naloga. Napravi besplatan nalog da generišeš nove planove, menjaš postojeće i sačuvaš svoja putovanja.",
  },
  community: {
    title: "Prijavi se da doprineseš",
    description:
      "Nalog treba za recenzije, fotografije mesta, predloge izmena, glasove i nova mesta. Email ostaje privatan.",
  },
};

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<AuthModalReason>("generation_limit");
  const [mode, setMode] = useState<AuthFormMode>("register");
  const [busy, setBusy] = useState(false);

  const openAuthModal = useCallback(
    (options: {
      reason: AuthModalReason;
      pendingAction?: PendingProtectedAction;
      initialMode?: AuthFormMode;
    }) => {
      if (options.pendingAction) {
        setPendingProtectedAction(options.pendingAction);
      }
      setReason(options.reason);
      setMode(options.initialMode ?? (options.reason === "save_trip" ? "login" : "register"));
      setOpen(true);
    },
    [],
  );

  async function resumePending() {
    setBusy(true);
    try {
      await resumePendingProtectedAction((href) => {
        router.push(href);
      });
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  const copy = COPY[reason];

  const value = useMemo(() => ({ openAuthModal }), [openAuthModal]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "register" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("register")}
            >
              Napravi nalog
            </Button>
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("login")}
            >
              Prijavi se
            </Button>
          </div>
          <AuthForm
            mode={mode}
            onModeChange={setMode}
            onSuccess={async () => {
              await refresh();
              setOpen(false);
              await resumePending();
            }}
          />
          <Button type="button" variant="ghost" className="w-full" onClick={() => setOpen(false)} disabled={busy}>
            Možda kasnije
          </Button>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
