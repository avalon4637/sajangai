"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { ChurnRiskCards } from "@/components/viral/churn-risk-cards";
import {
  CustomerRiskList,
  type CustomerRisk,
} from "@/components/viral/customer-risk-list";
import { MessagePreviewPanel } from "@/components/viral/message-preview-panel";
import { ChannelPerformance } from "@/components/viral/channel-performance";

export interface ChurnRisk {
  platform: string;
  lastOrderDate: string;
  daysSinceOrder: number;
  orderCount: number;
  riskLevel: "warning" | "critical";
}

export interface ViralPageProps {
  churnRisks: ChurnRisk[];
  updatedAt: string | null;
}

// Generate mock customer data from real churn risks
function generateCustomers(churnRisks: ChurnRisk[]): CustomerRisk[] {
  const MOCK_NAMES = [
    "김민수",
    "이서연",
    "박지훈",
    "최유진",
    "정다은",
    "강현우",
    "윤소희",
    "임재현",
    "한미영",
    "조승현",
  ];

  const CHANNELS = ["카카오", "문자", "앱 푸시"];
  const ACTIONS_CRITICAL = [
    "쿠폰 발송 권장",
    "재방문 할인 제안",
    "특별 프로모션 발송",
  ];
  const ACTIONS_WARNING = [
    "신메뉴 안내 발송",
    "이벤트 알림 발송",
    "적립금 안내",
  ];

  // Map real churn risk data to customer entries
  const fromReal = churnRisks.map((risk, idx) => ({
    id: `real-${idx}`,
    name: MOCK_NAMES[idx % MOCK_NAMES.length],
    platform: risk.platform,
    lastVisit: risk.lastOrderDate,
    daysSinceVisit: risk.daysSinceOrder,
    riskLevel: risk.riskLevel as "critical" | "warning" | "watching",
    channel: CHANNELS[idx % CHANNELS.length],
    recommendedAction:
      risk.riskLevel === "critical"
        ? ACTIONS_CRITICAL[idx % ACTIONS_CRITICAL.length]
        : ACTIONS_WARNING[idx % ACTIONS_WARNING.length],
    orderCount: risk.orderCount,
  }));

  // Add some watching-level demo entries if list is short
  if (fromReal.length < 5) {
    const watchingEntries: CustomerRisk[] = [
      {
        id: "watch-1",
        name: "송지원",
        platform: "배민",
        lastVisit: "2025-03-28",
        daysSinceVisit: 10,
        riskLevel: "watching",
        channel: "카카오",
        recommendedAction: "관찰 중",
        orderCount: 15,
      },
      {
        id: "watch-2",
        name: "오태현",
        platform: "카드",
        lastVisit: "2025-03-30",
        daysSinceVisit: 8,
        riskLevel: "watching",
        channel: "문자",
        recommendedAction: "관찰 중",
        orderCount: 7,
      },
    ];
    return [...fromReal, ...watchingEntries];
  }

  return fromReal;
}

/**
 * Main client component for the viral marketing page.
 * Purple (#8B5CF6) themed with 2-column layout.
 */
export function MarketingPageClient({
  churnRisks,
  updatedAt,
}: ViralPageProps) {
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRisk | null>(null);

  const customers = generateCustomers(churnRisks);

  // Derive card counts from the same customer list that the table uses
  const criticalCount = customers.filter(
    (c) => c.riskLevel === "critical"
  ).length;
  const warningCount = customers.filter(
    (c) => c.riskLevel === "warning"
  ).length;

  // Mock revisit count (demo) based on total customers
  const recentRevisits = Math.max(
    1,
    Math.floor(customers.length * 0.3)
  );

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">바이럴 / 마케팅</h1>
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800 hover:bg-violet-100">
            활동중
          </Badge>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
          <Send className="size-4" />
          메시지 보내기
        </Button>
      </div>

      {/* Churn Risk Summary Cards */}
      <ChurnRiskCards
        criticalCount={criticalCount}
        warningCount={warningCount}
        recentRevisits={recentRevisits}
      />

      {/* Main Content: 2 columns */}
      <div className="grid gap-6 lg:grid-cols-[55%_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          <CustomerRiskList
            customers={customers}
            selectedId={selectedCustomer?.id ?? null}
            onSelect={setSelectedCustomer}
          />
          <ChannelPerformance />
        </div>

        {/* Right Column - Message Preview */}
        <div>
          <MessagePreviewPanel selectedCustomer={selectedCustomer} />
        </div>
      </div>

      {/* Last updated */}
      {updatedAt && (
        <p className="text-xs text-muted-foreground text-right">
          마지막 분석:{" "}
          {new Date(updatedAt).toLocaleString("ko-KR")}
        </p>
      )}
    </div>
  );
}
