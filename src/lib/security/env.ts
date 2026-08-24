export function assertSecretEnv(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must never use the NEXT_PUBLIC_ prefix.");
  }
  if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY must never use the NEXT_PUBLIC_ prefix.");
  }
}

export function getServiceRoleKey(): string | undefined {
  assertSecretEnv();
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
