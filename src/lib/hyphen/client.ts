// Hyphen API client for card sales and delivery app integration
// Provides type-safe HTTP methods with retry logic and error handling

import {
  type HyphenConfig,
  type HyphenApiResponse,
  HyphenApiError,
} from "./types";

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

/**
 * Create a configured Hyphen API client instance.
 * Throws if HYPHEN_API_KEY is not set.
 */
export function createHyphenClient(overrides?: Partial<HyphenConfig>) {
  const apiKey = overrides?.apiKey ?? process.env.HYPHEN_API_KEY;

  if (!apiKey) {
    throw new HyphenApiError(
      401,
      "MISSING_API_KEY",
      "HYPHEN_API_KEY environment variable is not set"
    );
  }

  const config: HyphenConfig = {
    apiKey,
    baseUrl: overrides?.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    timeout: overrides?.timeout ?? DEFAULT_CONFIG.timeout,
    retries: overrides?.retries ?? DEFAULT_CONFIG.retries,
  };

  const isDev = process.env.NODE_ENV === "development";

  /**
   * Execute an HTTP request with retry logic and exponential backoff.
   * Retries on 5xx errors and network failures up to config.retries times.
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

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(config.timeout),
    };

    if (method === "POST" && options?.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    let lastError: Error | null = null;

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
        if (isDev) {
          console.log(`[Hyphen] ${method} ${url.toString()}`);
        }

        const response = await fetch(url.toString(), fetchOptions);

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
