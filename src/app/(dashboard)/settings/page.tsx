import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getConnectionByType, getAllSyncLogs } from "@/lib/queries/connection";
import { isHyphenConfigured } from "@/lib/hyphen/client";
import { ConnectionCard } from "@/components/settings/connection-card";
import { SyncHistory } from "@/components/settings/sync-history";

export default async function SettingsPage() {
  // Auth check (same pattern as other pages)
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
  } catch {
    redirect("/auth/onboarding");
  }
  const apiKeySet = isHyphenConfigured();

  // Fetch connections and sync logs in parallel
  const [cardSalesConnection, deliveryConnection, syncLogs] = await Promise.all(
    [
      getConnectionByType(businessId, "card_sales"),
      getConnectionByType(businessId, "delivery"),
      getAllSyncLogs(businessId, 10),
    ]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="size-6" />
        <div>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-sm text-muted-foreground">
            외부 서비스 연동 및 데이터 동기화를 관리합니다.
          </p>
        </div>
      </div>

      {/* Connection Cards */}
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

      {/* Sync History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">동기화 이력</h2>
        <SyncHistory logs={syncLogs} />
      </section>
    </div>
  );
}
