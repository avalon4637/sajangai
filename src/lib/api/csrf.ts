/**
 * CSRF Origin header verification for API routes.
 * Prevents cross-site request forgery by validating the Origin header.
 */

/**
 * Verify the Origin header matches allowed origins.
 * @param req - Incoming request
 * @returns true if origin is valid, false otherwise
 */
export function verifyCsrfOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:2000",
    "http://localhost:3000",
  ].filter(Boolean);

  return allowedOrigins.some((allowed) => origin === allowed);
}
