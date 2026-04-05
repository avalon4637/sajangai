import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getConnectionByType, getAllSyncLogs } from "@/lib/queries/connection";
import { isHyphenConfigured } from "@/lib/hyphen/client";
import { ConnectionCard } from "@/components/settings/connection-card";
import { SyncHistory } from "@/components/settings/sync-history";

export default async function SettingsPage() {
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
    console.error("[Settings] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }
  const apiKeySet = isHyphenConfigured();

  const [cardSalesConnection, deliveryConnection, syncLogs] = await Promise.all(
    [
      getConnectionByType(businessId, "card_sales"),
      getConnectionByType(businessId, "delivery"),
      getAllSyncLogs(businessId, 10),
    ]
  );

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">API 연동 관리</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ConnectionCard
            connectionType="card_sales"
            connection={cardSalesConnection}
            isApiKeySet={apiKeySet}
          />
          <ConnectionCard
            connectionType="delivery"
            connection={deliveryConnection}
            isApiKeySet={apiKeySet}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">동기화 이력</h2>
        <SyncHistory logs={syncLogs} />
      </section>
    </>
  );
}
