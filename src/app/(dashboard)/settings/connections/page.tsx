// Connections settings page
// Displays connection cards for delivery platforms and card sales
// Allows users to connect/disconnect integrations and trigger manual sync

import { redirect } from "next/navigation";
import { Link2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { getConnections } from "@/lib/queries/connection";
import { isHyphenConfigured } from "@/lib/hyphen/client";
import { PlatformConnectionCard } from "@/components/settings/platform-connection-card";

// Platform display metadata
const PLATFORMS = [
  {
    id: "baemin" as const,
    name: "배달의민족",
    description: "배달의민족 주문 매출과 리뷰를 자동으로 가져옵니다.",
    connectionType: "delivery" as const,
  },
  {
    id: "coupangeats" as const,
    name: "쿠팡이츠",
    description: "쿠팡이츠 주문 매출과 리뷰를 자동으로 가져옵니다.",
    connectionType: "delivery" as const,
  },
  {
    id: "yogiyo" as const,
    name: "요기요",
    description: "요기요 주문 매출과 리뷰를 자동으로 가져옵니다.",
    connectionType: "delivery" as const,
  },
  {
    id: "card" as const,
    name: "카드매출",
    description: "여신금융협회를 통해 카드 승인/매입/입금 내역을 가져옵니다.",
    connectionType: "card_sales" as const,
  },
] as const;

export default async function ConnectionsPage() {
  // Auth check
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
    console.error("[Connections] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  const [connections, hyphenConfigured] = await Promise.all([
    getConnections(businessId),
    Promise.resolve(isHyphenConfigured()),
  ]);

  // Map connections by type for lookup
  const connectionByType = new Map(
    connections.map((c) => [c.connection_type, c])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link2 className="size-6" />
        <div>
          <h1 className="text-2xl font-bold">외부 서비스 연동</h1>
          <p className="text-sm text-muted-foreground">
            배달앱, 카드매출 데이터를 연동하여 자동으로 매출을 수집합니다.
          </p>
        </div>
      </div>

      {/* Hyphen API status notice */}
      {!hyphenConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">실제 데이터 연동을 시작해보세요</p>
          <p className="mt-1 text-amber-700">
            현재 데모 데이터로 체험 중입니다. 아래에서 플랫폼을 연결하면 실제 매출 데이터를 자동으로 가져올 수 있어요.
          </p>
        </div>
      )}

      {/* How sync works */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="size-4" />
          동기화 방식
        </div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• 유료 플랜: 하루 5회 자동 동기화 (월 154회)</li>
          <li>• 무료 체험: 주 1회 자동 동기화 (월 8회)</li>
          <li>• 수동 동기화: 설정 페이지에서 언제든지 실행 가능</li>
        </ul>
      </div>

      {/* Platform connection cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">배달앱 연동</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.filter((p) => p.connectionType === "delivery").map(
            (platform) => (
              <PlatformConnectionCard
                key={platform.id}
                platformId={platform.id}
                platformName={platform.name}
                description={platform.description}
                connectionType={platform.connectionType}
                connection={connectionByType.get(platform.connectionType) ?? null}
                isApiKeySet={hyphenConfigured}
              />
            )
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">카드매출 연동</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLATFORMS.filter((p) => p.connectionType === "card_sales").map(
            (platform) => (
              <PlatformConnectionCard
                key={platform.id}
                platformId={platform.id}
                platformName={platform.name}
                description={platform.description}
                connectionType={platform.connectionType}
                connection={connectionByType.get(platform.connectionType) ?? null}
                isApiKeySet={hyphenConfigured}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}
