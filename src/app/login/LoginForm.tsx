"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { resumePendingProtectedAction } from "@/lib/access/resumePendingAction";

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();

  return (
    <AuthForm
      mode="login"
      onSuccess={async () => {
        await refresh();
        const resumed = await resumePendingProtectedAction((href) => {
          router.push(href);
        });
        if (!resumed) {
          router.push("/saved");
        }
        router.refresh();
      }}
    />
  );
}
