"use client";

// Cost Breakdown with drilldown for Seri analysis page
// Displays major expense categories with expandable sub-categories

import { useState } from "react";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CostSubCategory {
  name: string;
  amount: number;
  percentage: number;
  delta: number | null; // vs previous month %
}

export interface CostCategoryData {
  majorCategory: string;
  totalAmount: number;
  percentage: number;
  delta: number | null; // vs previous month %
  subCategories: CostSubCategory[];
}

export interface CostBreakdownProps {
  categories: CostCategoryData[];
  totalExpense: number;
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

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return null;

  const isIncrease = delta > 0;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 gap-0.5 ${
        isIncrease
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-green-50 text-[#059669] border-green-200"
      }`}
    >
      {isIncrease ? (
        <TrendingUp className="h-2.5 w-2.5" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" />
      )}
      {isIncrease ? "+" : ""}
      {Math.round(delta)}%
    </Badge>
  );
}

function CategoryItem({
  category,
  totalExpense,
}: {
  category: CostCategoryData;
  totalExpense: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const barWidth = totalExpense > 0 ? (category.totalAmount / totalExpense) * 100 : 0;

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Major category header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
      >
        {category.subCategories.length > 0 ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <div className="w-4 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">
              {category.majorCategory}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <DeltaBadge delta={category.delta} />
              <span className="text-sm font-bold tabular-nums">
                {formatAmount(category.totalAmount)}원
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                style={{ width: `${Math.min(barWidth, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
              {Math.round(category.percentage)}%
            </span>
          </div>
        </div>
      </button>

      {/* Sub-categories */}
      {expanded && category.subCategories.length > 0 && (
        <div className="border-t border-gray-50 bg-gray-50/30">
          {category.subCategories.map((sub) => {
            const subBarWidth =
              totalExpense > 0 ? (sub.amount / totalExpense) * 100 : 0;
            return (
              <div
                key={sub.name}
                className="flex items-center gap-3 px-3 py-2 pl-11 border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">
                      {sub.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <DeltaBadge delta={sub.delta} />
                      <span className="text-xs font-medium tabular-nums">
                        {formatAmount(sub.amount)}원
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#6EE7B7] transition-all duration-500"
                        style={{ width: `${Math.min(subBarWidth, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                      {Math.round(sub.percentage)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CostBreakdown({ categories, totalExpense }: CostBreakdownProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          비용 구성
        </h3>
        <Card className="border-gray-100">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              비용 데이터가 없습니다
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          비용 구성
        </h3>
        <span className="text-xs text-muted-foreground">
          총 {formatAmount(totalExpense)}원
        </span>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <CategoryItem
            key={cat.majorCategory}
            category={cat}
            totalExpense={totalExpense}
          />
        ))}
      </div>
    </div>
  );
}
