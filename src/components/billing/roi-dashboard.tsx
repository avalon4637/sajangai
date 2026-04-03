"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RoiBreakdown } from "@/lib/roi/calculator";

interface RoiDashboardProps {
  roi: RoiBreakdown | null;
}

export function RoiDashboard({ roi }: RoiDashboardProps) {
  if (!roi || roi.totalValue === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground text-sm">
            아직 ROI 데이터가 없어요. 인사이트를 실행하면 점장의 성과가 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const items = [
    { label: "절약한 돈", value: roi.feeSavings + roi.costSavings, emoji: "💰" },
    { label: "벌어준 돈", value: roi.anomalyPrevention + roi.customerRetention, emoji: "📈" },
    { label: "아껴준 시간", value: roi.timeSavings, emoji: "⏰", isTime: true },
  ];

  const hoursSaved = roi.timeSavings > 0
    ? Math.round(roi.timeSavings / 15000)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          점장 성과표
          <span className="text-xs font-normal text-muted-foreground">
            {roi.period}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big numbers */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {items.map((item) => (
            <div key={item.label}>
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="text-lg font-bold">
                {item.isTime
                  ? `${hoursSaved}시간`
                  : formatKRW(item.value)}
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        {/* ROI multiplier */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            점장 월급 {formatKRW(roi.subscriptionCost)}
          </p>
          <p className="text-2xl font-bold mt-1">
            {roi.roiMultiple}배 회수
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>수수료 절감</span>
            <span>{formatKRW(roi.feeSavings)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>이상 감지 효과</span>
            <span>{formatKRW(roi.anomalyPrevention)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>비용 절감</span>
            <span>{formatKRW(roi.costSavings)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>고객 복귀</span>
            <span>{formatKRW(roi.customerRetention)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>시간 절약</span>
            <span>{formatKRW(roi.timeSavings)}</span>
          </div>
          <div className="flex justify-between font-medium pt-1 border-t">
            <span>총 가치</span>
            <span>{formatKRW(roi.totalValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만원`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천원`;
  return `${n}원`;
}
