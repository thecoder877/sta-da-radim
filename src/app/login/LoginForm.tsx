"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { resumePendingProtectedAction } from "@/lib/access/resumePendingAction";

export function LoginForm() {
  const router = useRouter();

  return (
    <AuthForm
      mode="login"
      onSuccess={async () => {
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
