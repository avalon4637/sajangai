// Card sales sync module
// Uses actual Hyphen API endpoints: POST /in0007000033 (approval), /in0007000769 (deposit)

import { createClient } from "@/lib/supabase/server";
import { createHyphenClient, isHyphenConfigured } from "./client";
import {
  normalizeCardApproval,
  normalizeCardDeposit,
  type NormalizedCardDeposit,
} from "./normalizer";
import {
  CARD_ENDPOINTS,
  CARD_COMPANY_CODES,
  type HyphenCardApprovalData,
  type HyphenCardDepositData,
  type CardApprovalRequestBody,
  type CardDepositRequestBody,
} from "./types";

export interface CardSyncResult {
  approvalsCount: number;
  skippedCount: number;
  error?: string;
}

// Phase 2.2 — Settlement sync result
export interface CardSettlementSyncResult {
  settlementsCount: number;
  upsertedCount: number;
  skippedCount: number;
  error?: string;
}

/** Convert ISO date to yyyymmdd */
function toYmd(isoDate: string): string {
  return isoDate.replace(/-/g, "").slice(0, 8);
}

/**
 * Sync card approval records for a business.
 * Calls POST /in0007000033 for each configured card company.
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

  // Mock mode if no credentials
  if (!credentials?.userId || !isHyphenConfigured()) {
    return getMockCardResult();
  }

  const client = createHyphenClient();
  const cardCd = credentials.cardCd ?? "001"; // Default to Shinhan
  const cardCompanyName =
    CARD_COMPANY_CODES[cardCd] ?? "카드";

  try {
    const body: CardApprovalRequestBody = {
      cardCd,
      loginMethod: "ID",
      userId: credentials.cardUserId ?? credentials.userId,
      userPw: credentials.cardUserPw ?? credentials.userPw,
      sdate: toYmd(startDate),
      edate: toYmd(endDate),
      memberYn: credentials.memberNo ? "Y" : "N",
      memberNo: credentials.memberNo,
    };

    const response = await client.post<HyphenCardApprovalData>(
      CARD_ENDPOINTS.approval,
      body as unknown as Record<string, unknown>
    );

    const approvals = response.data?.list ?? [];

    const supabase = await createClient();
    let insertedCount = 0;
    let skippedCount = 0;

    for (const approval of approvals) {
      // Skip cancelled
      if (approval.appCancel === "Y" || approval.pchCancel === "Y") {
        skippedCount++;
        continue;
      }

      const normalized = normalizeCardApproval(
        approval,
        businessId,
        cardCompanyName
      );

      const { error } = await supabase.from("revenues").insert(normalized);

      if (error) {
        if (error.code === "23505") {
          skippedCount++;
        } else {
          console.error("[SyncCard] Insert error:", error.message);
          skippedCount++;
        }
      } else {
        insertedCount++;
      }
    }

    return { approvalsCount: insertedCount, skippedCount };
  } catch (error) {
    return {
      approvalsCount: 0,
      skippedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch card deposit (settlement) data for cash flow prediction.
 * Calls POST /in0007000769.
 */
export async function fetchCardDeposits(
  credentials: Record<string, string>,
  startDate: string,
  endDate: string
): Promise<NormalizedCardDeposit[]> {
  if (!isHyphenConfigured()) {
    return [];
  }

  const client = createHyphenClient();

  const body: CardDepositRequestBody = {
    cardCd: credentials.cardCd ?? "001",
    loginMethod: "ID",
    userId: credentials.cardUserId ?? credentials.userId,
    userPw: credentials.cardUserPw ?? credentials.userPw,
    sdate: toYmd(startDate),
    edate: toYmd(endDate),
    memberYn: credentials.memberNo ? "Y" : "N",
    memberNo: credentials.memberNo,
  };

  const response = await client.post<HyphenCardDepositData>(
    CARD_ENDPOINTS.deposit,
    body as unknown as Record<string, unknown>
  );

  return (response.data?.list ?? []).map(normalizeCardDeposit);
}

function getMockCardResult(): CardSyncResult {
  return { approvalsCount: 0, skippedCount: 0 };
}

// ─── Phase 2.2 — Card settlement sync ────────────────────────────────────────

/**
 * Sync card settlement (deposit) records for a business.
 * Persists the output of fetchCardDeposits() into card_settlements table so
 * the monthly ROI report and cashflow widget can query "돈이 언제 들어오는지".
 *
 * Uses UNIQUE (business_id, card_company, pay_scheduled_date, sales_amount)
 * for dedup via upsert.
 */
export async function syncCardSettlements(
  businessId: string,
  credentials: Record<string, string> | undefined,
  lastSyncAt: string | null
): Promise<CardSettlementSyncResult> {
  if (!credentials?.userId || !isHyphenConfigured()) {
    return { settlementsCount: 0, upsertedCount: 0, skippedCount: 0 };
  }

  // Fetch window: last 30 days (or since lastSyncAt) + next 14 days forecast
  const startDate = lastSyncAt
    ? lastSyncAt.slice(0, 10)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      })();
  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() + 14);
  const endDate = endDateObj.toISOString().slice(0, 10);

  try {
    const deposits = await fetchCardDeposits(credentials, startDate, endDate);

    if (deposits.length === 0) {
      return { settlementsCount: 0, upsertedCount: 0, skippedCount: 0 };
    }

    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    let upsertedCount = 0;
    let skippedCount = 0;

    for (const dep of deposits) {
      const status: "pending" | "settled" | "cancelled" = dep.payDate
        ? dep.payDate <= today
          ? "settled"
          : "pending"
        : "pending";

      const row = {
        business_id: businessId,
        card_company: dep.cardCompany || "카드",
        pay_date: dep.payDate || null,
        pay_scheduled_date: dep.payScheduledDate,
        sales_amount: dep.salesAmount,
        pay_amount: dep.payAmount,
        fee_total: dep.feeTotal,
        transaction_count: dep.transactionCount,
        status,
      };

      const { error } = await supabase.from("card_settlements").upsert(row, {
        onConflict: "business_id,card_company,pay_scheduled_date,sales_amount",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error("[SyncCardSettlements] Upsert error:", error.message);
        skippedCount++;
      } else {
        upsertedCount++;
      }
    }

    return {
      settlementsCount: deposits.length,
      upsertedCount,
      skippedCount,
    };
  } catch (error) {
    return {
      settlementsCount: 0,
      upsertedCount: 0,
      skippedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
