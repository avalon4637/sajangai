// Hyphen API type definitions for card sales and delivery app integration

/** Configuration for Hyphen API client */
export interface HyphenConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retries: number;
}

/** Standard API response wrapper from Hyphen */
export interface HyphenApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Custom error class for Hyphen API errors */
export class HyphenApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "HyphenApiError";
  }
}

/** Connection status for API integrations */
export type ConnectionStatus = "active" | "inactive" | "error" | "expired";

/** Sync job status */
export type SyncStatus = "pending" | "running" | "completed" | "failed";

/** Connection type identifier */
export type ConnectionType = "card_sales" | "delivery";

/** API connection record stored in database */
export interface ApiConnection {
  id: string;
  business_id: string;
  provider: string;
  connection_type: ConnectionType;
  status: ConnectionStatus;
  config: Record<string, unknown>;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Sync log record stored in database */
export interface SyncLog {
  id: string;
  connection_id: string;
  sync_type: ConnectionType;
  status: SyncStatus;
  records_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}
