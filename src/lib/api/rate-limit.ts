// Supabase-backed sliding window rate limiter for API routes
// Replaces the in-memory Map that reset on every Vercel serverless cold start.
// Uses `rate_limit_entries` table for persistent, cross-instance rate limiting.

import { createClient } from "@/lib/supabase/server";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key using Supabase sliding window.
 * Inserts a row into rate_limit_entries, counts recent rows in the window,
 * and prunes entries older than the window on each call.
 *
 * @param key - Unique identifier (userId:routeName)
 * @param limit - Max requests per window
 * @param windowMs - Window size in milliseconds (default 60s)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(now - windowMs).toISOString();
  const resetAt = now + windowMs;

  try {
    const supabase = await createClient();

    // Cast to 'any' because rate_limit_entries is not in generated types yet.
    // The table was created via migration 20260412100000_rate_limit_entries.sql.
    const rl = supabase.from("rate_limit_entries" as never);

    // Insert current request entry
    await (rl as ReturnType<typeof supabase.from>).insert({ key } as never);

    // Count entries in the sliding window
    const { count, error } = await supabase
      .from("rate_limit_entries" as never)
      .select("*", { count: "exact", head: true })
      .eq("key" as never, key)
      .gte("created_at" as never, windowStart);

    if (error) {
      // On DB error, fail closed for AI routes to prevent cost explosion
      console.error("[rate-limit] count query failed:", error.message);
      return { allowed: false, remaining: 0, resetAt };
    }

    const currentCount = count ?? 0;

    // Prune old entries (fire-and-forget, non-blocking)
    void supabase
      .from("rate_limit_entries" as never)
      .delete()
      .eq("key" as never, key)
      .lt("created_at" as never, windowStart)
      .then(({ error: delErr }: { error: { message: string } | null }) => {
        if (delErr) console.error("[rate-limit] prune failed:", delErr.message);
      });

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount),
      resetAt,
    };
  } catch (err) {
    // On unexpected error, fail closed to prevent cost explosion
    console.error("[rate-limit] unexpected error:", err);
    return { allowed: false, remaining: 0, resetAt };
  }
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
