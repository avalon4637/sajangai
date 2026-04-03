"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BudgetVsActual } from "@/lib/queries/budget";

const DEFAULT_CATEGORIES = [
  "revenue",
  "고정비용",
  "인건비",
  "식자재",
  "소모품",
  "운영비",
  "마케팅",
  "수수료",
];

const CATEGORY_LABELS: Record<string, string> = {
  revenue: "매출 목표",
  "고정비용": "고정비용",
  "인건비": "인건비",
  "식자재": "식자재",
  "소모품": "소모품",
  "운영비": "운영비",
  "마케팅": "마케팅",
  "수수료": "수수료",
};

interface BudgetManagerProps {
  businessId: string;
  comparison: BudgetVsActual[];
  year: number;
  month: number;
}

export function BudgetManager({ businessId, comparison, year, month }: BudgetManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of comparison) {
      init[c.category] = String(c.targetAmount);
    }
    return init;
  });

  const handleSave = async (category: string) => {
    const amount = Number(values[category] ?? 0);
    if (isNaN(amount)) return;

    setSaving(category);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, year, month, category, targetAmount: amount }),
    });
    setSaving(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">
        {year}년 {month}월 예산
      </p>

      <div className="space-y-3">
        {DEFAULT_CATEGORIES.map((cat) => {
          const existing = comparison.find((c) => c.category === cat);
          const isRevenue = cat === "revenue";

          return (
            <Card key={cat}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{CATEGORY_LABELS[cat] ?? cat}</p>
                    {existing && existing.targetAmount > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              existing.achievementRate >= 100
                                ? isRevenue ? "bg-green-500" : "bg-red-500"
                                : isRevenue ? "bg-blue-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.min(100, existing.achievementRate)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {existing.achievementRate}%
                        </span>
                      </div>
                    )}
                    {existing && existing.targetAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        실적 {formatKRW(existing.actualAmount)} / 목표 {formatKRW(existing.targetAmount)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-32 text-right text-sm"
                      placeholder="목표 금액"
                      value={values[cat] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [cat]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving === cat}
                      onClick={() => handleSave(cat)}
                    >
                      {saving === cat ? "..." : "저장"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만원`;
  return `${n.toLocaleString()}원`;
}
