// Hyphen OAuth token manager
// Handles access token lifecycle: acquisition, caching, and refresh
// Structured to support both API key auth (MVP) and OAuth2 (future)

/** OAuth token response from Hyphen API */
interface HyphenTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

/** Cached token with expiry tracking */
interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

/** In-memory token cache (resets on server restart) */
const tokenCache = new Map<string, CachedToken>();

/** 24 hours before expiry - refresh threshold */
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** 7 days - default token validity */
const DEFAULT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get cache key for a set of credentials.
 * Uses clientId to scope tokens per integration.
 */
function getCacheKey(clientId: string): string {
  return `hyphen_token_${clientId}`;
}

/**
 * Check whether a cached token needs refresh.
 * Returns true if token expires within 24 hours.
 */
function needsRefresh(cached: CachedToken): boolean {
  return Date.now() >= cached.expiresAt - REFRESH_THRESHOLD_MS;
}

/**
 * Fetch a new OAuth2 access token using client credentials flow.
 * Called when no cached token exists or the cached token is expiring.
 *
 * @throws Error if credentials are invalid or API is unreachable
 */
export async function refreshToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const tokenUrl =
    process.env.HYPHEN_TOKEN_URL ?? "https://api.hyphen.im/oauth/token";

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "read write",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Hyphen token refresh failed: HTTP ${response.status} - ${errorText}`
    );
  }

  const data: HyphenTokenResponse = await response.json();

  // Store in cache with expiry
  const expiresAt = Date.now() + (data.expires_in * 1000 || DEFAULT_TOKEN_TTL_MS);
  const cacheKey = getCacheKey(clientId);
  tokenCache.set(cacheKey, {
    accessToken: data.access_token,
    expiresAt,
  });

  return data.access_token;
}

/**
 * Get a valid access token, refreshing automatically if needed.
 *
 * MVP mode: If HYPHEN_API_KEY is set, returns the API key directly
 * (simulating Bearer token without OAuth flow).
 *
 * OAuth mode: Uses client credentials flow with clientId/clientSecret.
 *
 * @param clientId - OAuth client ID (required for OAuth mode)
 * @param clientSecret - OAuth client secret (required for OAuth mode)
 * @returns Valid access token string
 */
export async function getAccessToken(
  clientId?: string,
  clientSecret?: string
): Promise<string> {
  // MVP fallback: use API key as bearer token if OAuth creds not provided
  if (!clientId || !clientSecret) {
    const apiKey = process.env.HYPHEN_API_KEY;
    if (!apiKey) {
      throw new Error(
        "No Hyphen credentials available. Set HYPHEN_API_KEY or provide clientId/clientSecret."
      );
    }
    return apiKey;
  }

  const cacheKey = getCacheKey(clientId);
  const cached = tokenCache.get(cacheKey);

  // Return cached token if still valid
  if (cached && !needsRefresh(cached)) {
    return cached.accessToken;
  }

  // Refresh token
  return refreshToken(clientId, clientSecret);
}

/**
 * Invalidate cached token for a client ID.
 * Call this when a 401 response is received to force re-authentication.
 */
export function invalidateToken(clientId: string): void {
  const cacheKey = getCacheKey(clientId);
  tokenCache.delete(cacheKey);
}

/**
 * Clear all cached tokens.
 * Useful for testing or when credentials change.
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
