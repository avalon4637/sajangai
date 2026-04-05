import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import {
  MarketingPageClient,
  type ChurnRisk,
  type ViralPageProps,
} from "./page-client";

interface ViralContext {
  churnRisks: ChurnRisk[];
  totalAtRisk: number;
  messagesGenerated: number;
  updatedAt: string;
}

/**
 * Server component: fetches viral agent data and passes to client.
 */
export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch (error) {
    console.error("[Marketing] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  // Load viral agent context from store_context
  const { data: viralStore } = await supabase
    .from("store_context")
    .select("context_data, summary, updated_at")
    .eq("business_id", businessId)
    .eq("agent_type", "viral")
    .maybeSingle();

  const viralData = viralStore?.context_data as unknown as ViralContext | null;
  const churnRisks = viralData?.churnRisks ?? [];

  const props: ViralPageProps = {
    churnRisks,
    updatedAt: viralStore?.updated_at ?? null,
  };

  return <MarketingPageClient {...props} />;
}
