// Hyphen API client for card sales and delivery app integration
// Provides type-safe HTTP methods with retry logic, error handling, and OAuth token refresh

import {
  type HyphenConfig,
  type HyphenApiResponse,
  HyphenApiError,
} from "./types";
import { getAccessToken, invalidateToken } from "./oauth";

const DEFAULT_CONFIG: Omit<HyphenConfig, "apiKey"> = {
  baseUrl: "https://api.hyphen.im",
  timeout: 30_000,
  retries: 3,
};

/** Delay helper for exponential backoff */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if Hyphen API key is configured */
export function isHyphenConfigured(): boolean {
  return !!process.env.HYPHEN_API_KEY;
}

/** Extended config with optional OAuth credentials */
interface HyphenClientConfig extends HyphenConfig {
  oauthClientId?: string;
  oauthClientSecret?: string;
}

/**
 * Create a configured Hyphen API client instance.
 * Supports both API key auth (MVP) and OAuth2 token refresh.
 * Falls back gracefully if HYPHEN_API_KEY is not set (mock mode).
 */
export function createHyphenClient(overrides?: Partial<HyphenClientConfig>) {
  const apiKey = overrides?.apiKey ?? process.env.HYPHEN_API_KEY;
  const oauthClientId =
    overrides?.oauthClientId ?? process.env.HYPHEN_CLIENT_ID;
  const oauthClientSecret =
    overrides?.oauthClientSecret ?? process.env.HYPHEN_CLIENT_SECRET;

  const config: HyphenClientConfig = {
    apiKey: apiKey ?? "mock-key",
    baseUrl: overrides?.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    timeout: overrides?.timeout ?? DEFAULT_CONFIG.timeout,
    retries: overrides?.retries ?? DEFAULT_CONFIG.retries,
    oauthClientId,
    oauthClientSecret,
  };

  const isDev = process.env.NODE_ENV === "development";

  /**
   * Resolve the current access token.
   * Uses OAuth2 if credentials are available, falls back to API key.
   */
  async function resolveToken(): Promise<string> {
    if (oauthClientId && oauthClientSecret) {
      return getAccessToken(oauthClientId, oauthClientSecret);
    }
    // MVP: use API key directly as bearer token
    if (apiKey) {
      return apiKey;
    }
    throw new HyphenApiError(
      401,
      "MISSING_CREDENTIALS",
      "No Hyphen credentials available. Set HYPHEN_API_KEY or HYPHEN_CLIENT_ID/SECRET."
    );
  }

  /**
   * Execute an HTTP request with retry logic, exponential backoff, and
   * automatic token refresh on 401 responses.
   */
  async function request<T>(
    method: "GET" | "POST",
    endpoint: string,
    options?: {
      params?: Record<string, string>;
      body?: unknown;
    }
  ): Promise<T> {
    const url = new URL(endpoint, config.baseUrl);

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, value);
      }
    }

    let lastError: Error | null = null;
    let tokenRefreshed = false;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const backoff = Math.pow(2, attempt - 1) * 1000;
        if (isDev) {
          console.log(
            `[Hyphen] Retry attempt ${attempt}/${config.retries} after ${backoff}ms`
          );
        }
        await delay(backoff);
      }

      try {
        // Resolve current access token (may refresh if needed)
        const token = await resolveToken();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: AbortSignal.timeout(config.timeout),
        };

        if (method === "POST" && options?.body) {
          fetchOptions.body = JSON.stringify(options.body);
        }

        if (isDev) {
          console.log(`[Hyphen] ${method} ${url.toString()}`);
        }

        const response = await fetch(url.toString(), fetchOptions);

        // Handle 401 with token refresh (once per request)
        if (response.status === 401 && !tokenRefreshed && oauthClientId) {
          tokenRefreshed = true;
          invalidateToken(oauthClientId);
          // Retry immediately without counting as a regular retry
          attempt--;
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let errorCode = `HTTP_${response.status}`;

          try {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.message ?? parsed.error ?? errorMessage;
            errorCode = parsed.code ?? errorCode;
          } catch {
            // Use raw text as error message if JSON parsing fails
            if (errorBody) {
              errorMessage = errorBody;
            }
          }

          const apiError = new HyphenApiError(
            response.status,
            errorCode,
            errorMessage
          );

          // Only retry on 5xx server errors
          if (response.status >= 500) {
            lastError = apiError;
            continue;
          }

          // Do not retry on 4xx client errors
          throw apiError;
        }

        const data: HyphenApiResponse<T> = await response.json();

        if (isDev) {
          console.log(`[Hyphen] Response:`, JSON.stringify(data).slice(0, 200));
        }

        if (!data.success) {
          throw new HyphenApiError(
            response.status,
            "API_ERROR",
            data.error ?? data.message ?? "Unknown API error"
          );
        }

        return data.data as T;
      } catch (error) {
        if (error instanceof HyphenApiError) {
          // If it is a client error (4xx), rethrow immediately
          if (error.status < 500) {
            throw error;
          }
          lastError = error;
        } else if (error instanceof DOMException && error.name === "AbortError") {
          lastError = new HyphenApiError(408, "TIMEOUT", "Request timed out");
        } else {
          lastError = new HyphenApiError(
            0,
            "NETWORK_ERROR",
            error instanceof Error ? error.message : "Network error"
          );
        }
      }
    }

    // All retries exhausted
    throw lastError ?? new HyphenApiError(500, "UNKNOWN", "Request failed");
  }

  return {
    /**
     * Send a GET request to the Hyphen API.
     * @param endpoint - API endpoint path (e.g., "/v1/card-sales")
     * @param params - Optional query parameters
     */
    async get<T>(
      endpoint: string,
      params?: Record<string, string>
    ): Promise<T> {
      return request<T>("GET", endpoint, { params });
    },

    /**
     * Send a POST request to the Hyphen API.
     * @param endpoint - API endpoint path
     * @param body - Request body payload
     */
    async post<T>(endpoint: string, body: unknown): Promise<T> {
      return request<T>("POST", endpoint, { body });
    },
  };
}

/** Type for the Hyphen client instance */
export type HyphenClient = ReturnType<typeof createHyphenClient>;
