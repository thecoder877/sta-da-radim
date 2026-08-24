type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const isProduction = process.env.NODE_ENV === "production";

function emit(level: LogLevel, message: string, meta?: LogMeta): void {
  // Structured JSON in production (easy to ship to a log drain), readable
  // lines in development.
  const line = isProduction
    ? JSON.stringify({ level, message, ...meta, time: new Date().toISOString() })
    : `[${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/**
 * Minimal structured logger. Swap `emit` for a real log drain / error
 * tracker (Sentry, Datadog, ...) without touching call sites.
 */
export const logger = {
  debug(message: string, meta?: LogMeta) {
    if (!isProduction) {
      emit("debug", message, meta);
    }
  },
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    emit("error", message, meta);
  },
};

export function errorMeta(error: unknown): LogMeta {
  if (error instanceof Error) {
    return { error: error.message, stack: error.stack };
  }
  return { error: String(error) };
}
