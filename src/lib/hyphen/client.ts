// Hyphen API client
// Uses user-id + Hkey header authentication per actual Hyphen API spec
// All endpoints are POST requests to /inXXXXXXXXXX paths

import {
  type HyphenConfig,
  type HyphenApiResponse,
  HyphenApiError,
} from "./types";

const DEFAULT_CONFIG: Omit<HyphenConfig, "userId" | "hkey"> = {
  baseUrl: "https://api.hyphen.im",
  timeout: 30_000,
  retries: 3,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isHyphenConfigured(): boolean {
  return !!process.env.HYPHEN_USER_ID && !!process.env.HYPHEN_HKEY;
}

/**
 * Create a Hyphen API client with user-id + Hkey authentication.
 * All requests are POST with JSON body.
 */
export function createHyphenClient(overrides?: Partial<HyphenConfig>) {
  const config: HyphenConfig = {
    userId: overrides?.userId ?? process.env.HYPHEN_USER_ID ?? "",
    hkey: overrides?.hkey ?? process.env.HYPHEN_HKEY ?? "",
    baseUrl: overrides?.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    timeout: overrides?.timeout ?? DEFAULT_CONFIG.timeout,
    retries: overrides?.retries ?? DEFAULT_CONFIG.retries,
  };

  const isDev = process.env.NODE_ENV === "development";
  const isTest = !!process.env.HYPHEN_TEST_MODE;

  /**
   * POST request to Hyphen API endpoint.
   * @param endpoint - Transaction code path (e.g., "/in0007000033")
   * @param body - Request body payload
   */
  async function post<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<HyphenApiResponse<T>> {
    const url = `${config.baseUrl}${endpoint}`;

    if (!config.userId || !config.hkey) {
      throw new HyphenApiError(
        401,
        "MISSING_CREDENTIALS",
        "Hyphen credentials not configured. Set HYPHEN_USER_ID and HYPHEN_HKEY."
      );
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      if (attempt > 0) {
        const backoff = Math.pow(2, attempt - 1) * 1000;
        if (isDev) {
          console.log(
            `[Hyphen] Retry ${attempt}/${config.retries} after ${backoff}ms`
          );
        }
        await delay(backoff);
      }

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "user-id": config.userId,
          Hkey: config.hkey,
        };

        // Add test mode header if configured
        if (isTest) {
          headers["hyphen-gustation"] = "Y";
        }

        if (isDev) {
          console.log(`[Hyphen] POST ${url}`);
        }

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(config.timeout),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const apiError = new HyphenApiError(
            response.status,
            `HTTP_${response.status}`,
            errorBody || response.statusText
          );

          if (response.status >= 500) {
            lastError = apiError;
            continue;
          }
          throw apiError;
        }

        const data: HyphenApiResponse<T> = await response.json();

        if (isDev) {
          console.log(
            `[Hyphen] Response: errYn=${data.common?.errYn}, errCd=${data.common?.errCd}`
          );
        }

        // Check Hyphen-level error
        if (data.common?.errYn === "Y") {
          throw new HyphenApiError(
            200,
            data.common.errCd || "API_ERROR",
            data.common.errMsg || "Hyphen API error"
          );
        }

        return data;
      } catch (error) {
        if (error instanceof HyphenApiError) {
          if (error.status > 0 && error.status < 500) {
            throw error;
          }
          lastError = error;
        } else if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
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

    throw lastError ?? new HyphenApiError(500, "UNKNOWN", "Request failed");
  }

  return { post };
}

export type HyphenClient = ReturnType<typeof createHyphenClient>;
