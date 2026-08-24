import { z } from "zod";
import { logger } from "@/lib/logger";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  APP_SECRET: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

/**
 * Validate environment configuration at server startup. Everything is
 * optional (the app degrades gracefully), so this only logs warnings for
 * clearly broken setups instead of throwing.
 */
export function validateServerEnv(): void {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      logger.warn(`Invalid environment variable: ${issue.path.join(".")} — ${issue.message}`);
    }
    return;
  }

  const env = parsed.data;
  const hasUrl = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnon = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (hasUrl !== hasAnon) {
    logger.warn(
      "Supabase is only partially configured. Set both NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (or neither). Accounts, saving, and sharing stay disabled until both are set.",
    );
  }

  if (!env.APP_SECRET) {
    logger.debug(
      "APP_SECRET is not set: the anonymous generation-quota cookie is unsigned (still enforced, just not tamper-proof).",
    );
  }
}
