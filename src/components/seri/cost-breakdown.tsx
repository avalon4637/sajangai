"use client";

// Cost Breakdown Cards for Seri analysis page
// Displays 4 cost category cards with progress bars

import { Users, ShoppingCart, Truck, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MonthlyAnalysisSummary } from "@/lib/queries/daily-revenue";

interface CostBreakdownProps {
  summary: MonthlyAnalysisSummary;
}

// Format Korean currency with man/eok units
function formatAmount(amount: number): string {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억`;
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만`;
  }
  return amount.toLocaleString();
}

interface CostCategory {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  // Estimated percentage of total revenue
  ratio: number;
  iconClass: string;
  color: string;
}

const COST_CATEGORIES: CostCategory[] = [
  {
    label: "인건비",
    icon: Users,
    ratio: 0.3,
    iconClass: "text-[#10B981]",
    color: "#10B981",
  },
  {
    label: "재료비",
    icon: ShoppingCart,
    ratio: 0.25,
    iconClass: "text-[#059669]",
    color: "#059669",
  },
  {
    label: "배달수수료",
    icon: Truck,
    ratio: 0.12,
    iconClass: "text-[#34D399]",
    color: "#34D399",
  },
  {
    label: "임대료",
    icon: Building2,
    ratio: 0.05,
    iconClass: "text-[#6EE7B7]",
    color: "#6EE7B7",
  },
];

export function CostBreakdown({ summary }: CostBreakdownProps) {
  const totalRevenue = summary.totalRevenue;
  const totalCostRatio = COST_CATEGORIES.reduce((s, c) => s + c.ratio, 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">
        비용 구성
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {COST_CATEGORIES.map((cat) => {
          const amount = totalRevenue * cat.ratio;
          const percent = Math.round(cat.ratio * 100);
          const barWidth = Math.round((cat.ratio / totalCostRatio) * 100);
          const Icon = cat.icon;

          return (
            <Card key={cat.label} className="border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center bg-[#ECFDF5]">
                    <Icon className={`h-3.5 w-3.5 ${cat.iconClass}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {cat.label}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  {formatAmount(amount)}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">
                    원
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    매출 대비 {percent}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
