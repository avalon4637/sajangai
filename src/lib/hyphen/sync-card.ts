// Card sales sync module
// Fetches card approval and settlement data from Hyphen API
// Maps to the revenues table with channel='카드'

import { createClient } from "@/lib/supabase/server";
import { createHyphenClient } from "./client";
import {
  normalizeCardSale,
  type HyphenCardApproval,
  type HyphenCardSettlement,
} from "./normalizer";

/** Mock card approval data for development without real API credentials */
function getMockCardApprovals(count: number = 10): HyphenCardApproval[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(i / 3));
    const hour = 10 + (i % 12);
    return {
      approvalNo: `MOCK-CARD-${Date.now()}-${i}`,
      approvalDate: date.toISOString().slice(0, 10),
      approvalDatetime: `${date.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:${String(i * 5 % 60).padStart(2, "0")}:00`,
      cardCompany: ["신한카드", "KB국민카드", "현대카드", "롯데카드"][i % 4],
      cardNo: `****-****-****-${String(1000 + i).slice(-4)}`,
      approvalAmount: 10000 + Math.floor(Math.random() * 50000),
      isCancelled: false,
    };
  });
}

/** Result of a card sales sync operation */
export interface CardSyncResult {
  approvalsCount: number;
  skippedCount: number;
  error?: string;
}

/**
 * Sync card approval records for a business.
 * Maps to revenues table with channel='카드' for tracking card payment income.
 *
 * @param businessId - Business to sync for
 * @param credentials - Card sales API credentials (may be undefined for mock mode)
 * @param lastSyncAt - ISO timestamp of last successful sync
 */
export async function syncCardSales(
  businessId: string,
  credentials: Record<string, string> | undefined,
  lastSyncAt: string | null
): Promise<CardSyncResult> {
  const startDate = lastSyncAt
    ? lastSyncAt.slice(0, 10)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      })();
  const endDate = new Date().toISOString().slice(0, 10);

  let rawApprovals: HyphenCardApproval[];

  const useMock =
    !credentials?.apiKey && !process.env.HYPHEN_API_KEY;

  if (useMock) {
    rawApprovals = getMockCardApprovals();
  } else {
    try {
      const client = createHyphenClient(
        credentials?.apiKey ? { apiKey: credentials.apiKey } : undefined
      );
      const response = await client.get<{ approvals: HyphenCardApproval[] }>(
        "/v1/card/approvals",
        {
          startDate,
          endDate,
          merchantNo: credentials?.merchantNo ?? "",
        }
      );
      rawApprovals = response.approvals ?? [];
    } catch (error) {
      return {
        approvalsCount: 0,
        skippedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  const supabase = await createClient();
  let insertedCount = 0;
  let skippedCount = 0;

  for (const approval of rawApprovals) {
    // Skip cancelled/reversed transactions
    if (approval.isCancelled) {
      skippedCount++;
      continue;
    }

    const normalized = normalizeCardSale(approval, businessId);

    const { error } = await supabase.from("revenues").insert(normalized);

    if (error) {
      if (error.code === "23505") {
        // Duplicate - already synced
        skippedCount++;
      } else {
        console.error("[SyncCard] Insert error:", error.message);
        skippedCount++;
      }
    } else {
      insertedCount++;
    }
  }

  return {
    approvalsCount: insertedCount,
    skippedCount,
  };
}

/**
 * Fetch card settlement summary (not stored individually, used for reporting).
 * Returns aggregated settlement data for a date range.
 *
 * @param credentials - Card sales API credentials
 * @param startDate - YYYY-MM-DD
 * @param endDate - YYYY-MM-DD
 */
export async function fetchCardSettlements(
  credentials: Record<string, string> | undefined,
  startDate: string,
  endDate: string
): Promise<HyphenCardSettlement[]> {
  const useMock =
    !credentials?.apiKey && !process.env.HYPHEN_API_KEY;

  if (useMock) {
    // Return mock settlement summary
    return [
      {
        settlementDate: endDate,
        cardCompany: "전체",
        totalAmount: 500000,
        feeAmount: 15000,
        netAmount: 485000,
        transactionCount: 25,
      },
    ];
  }

  const client = createHyphenClient(
    credentials?.apiKey ? { apiKey: credentials.apiKey } : undefined
  );
  const response = await client.get<{ settlements: HyphenCardSettlement[] }>(
    "/v1/card/settlements",
    {
      startDate,
      endDate,
      merchantNo: credentials?.merchantNo ?? "",
    }
  );
  return response.settlements ?? [];
}
