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
