export async function register() {
  // Only run in the Node.js server runtime (skip Edge/browser).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerEnv } = await import("@/lib/env");
    validateServerEnv();
  }
}

export async function onRequestError(error: unknown) {
  const { logger, errorMeta } = await import("@/lib/logger");
  logger.error("Unhandled server error", errorMeta(error));
}
