// Simple in-memory rate limiter for API routes
// Note: In-memory store resets on serverless cold starts.
// For production, consider Upstash Redis (@upstash/ratelimit).

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 60_000);

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (e.g., userId + route).
 * @param key - Unique identifier (userId:routeName)
 * @param limit - Max requests per window
 * @param windowMs - Window size in milliseconds (default 60s)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Build a rate limit key from authenticated user ID.
 * Falls back to IP only for unauthenticated routes.
 * Using user.id prevents IP spoofing via X-Forwarded-For.
 */
export function getRateLimitKey(request: Request, route: string, userId?: string): string {
  if (userId) {
    return `${userId}:${route}`;
  }
  // Fallback for unauthenticated routes only
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${route}`;
}
