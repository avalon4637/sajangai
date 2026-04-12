// Phase 3.3 — Structured logger wrapper
//
// Thin abstraction over console that adds consistent fields (level, context,
// timestamp) and is ready to be swapped for Sentry / Axiom / Logtail when
// the team chooses a vendor. For now it just formats console output so it's
// grep-able in Vercel logs.
//
// Usage:
//   import { logger } from "@/lib/observability/logger";
//   logger.info("hyphen sync started", { businessId, platform: "baemin" });
//   logger.error("claude call failed", err, { caller: "seri-engine" });

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LoggerAdapter {
  log(level: LogLevel, message: string, context?: LogContext): void;
}

// Default adapter: pretty console output that plays well with Vercel's log UI.
const consoleAdapter: LoggerAdapter = {
  log(level, message, context) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const payload = context
      ? `${prefix} ${message} ${JSON.stringify(context)}`
      : `${prefix} ${message}`;

    switch (level) {
      case "debug":
        if (process.env.NODE_ENV !== "production") {
          console.debug(payload);
        }
        break;
      case "info":
        console.log(payload);
        break;
      case "warn":
        console.warn(payload);
        break;
      case "error":
        console.error(payload);
        break;
    }
  },
};

let adapter: LoggerAdapter = consoleAdapter;

/**
 * Swap the logger adapter at runtime. Call this once from a root setup file
 * when wiring up Sentry / Axiom / Logtail / etc.
 */
export function setLoggerAdapter(newAdapter: LoggerAdapter): void {
  adapter = newAdapter;
}

function normalizeError(err: unknown): LogContext {
  if (err instanceof Error) {
    return {
      error_name: err.name,
      error_message: err.message,
      error_stack:
        process.env.NODE_ENV === "production" ? undefined : err.stack,
    };
  }
  return { error_value: String(err) };
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    adapter.log("debug", message, context);
  },
  info(message: string, context?: LogContext): void {
    adapter.log("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    adapter.log("warn", message, context);
  },
  /**
   * Error variant that accepts either `(message, error, context)` or
   * `(message, context)` for ergonomics.
   */
  error(
    message: string,
    errorOrContext?: unknown,
    extraContext?: LogContext
  ): void {
    const isError =
      errorOrContext instanceof Error ||
      (typeof errorOrContext === "object" &&
        errorOrContext !== null &&
        "message" in errorOrContext);

    if (isError) {
      adapter.log("error", message, {
        ...normalizeError(errorOrContext),
        ...extraContext,
      });
    } else {
      adapter.log("error", message, errorOrContext as LogContext);
    }
  },
};
