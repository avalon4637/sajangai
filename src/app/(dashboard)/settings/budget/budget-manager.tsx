"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { BudgetPageData, BudgetVsActual } from "@/lib/queries/budget";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Check,
  X,
  Lightbulb,
  DollarSign,
  Users,
  Zap,
  ShoppingBag,
  Wrench,
  Megaphone,
  MoreHorizontal,
  Building,
  CircleDollarSign,
} from "lucide-react";

// Screen golf business categories
const CATEGORIES = [
  { key: "매출", label: "매출", icon: CircleDollarSign, isRevenue: true },
  { key: "고정비", label: "고정비", icon: Building, isRevenue: false },
  { key: "인건비", label: "인건비", icon: Users, isRevenue: false },
  { key: "소모품", label: "소모품 (골프공/장갑)", icon: ShoppingBag, isRevenue: false },
  { key: "전기료", label: "전기료", icon: Zap, isRevenue: false },
  { key: "마케팅", label: "마케팅", icon: Megaphone, isRevenue: false },
  { key: "수선비", label: "수선비", icon: Wrench, isRevenue: false },
  { key: "기타", label: "기타", icon: MoreHorizontal, isRevenue: false },
] as const;

interface BudgetManagerProps {
  businessId: string;
  pageData: BudgetPageData;
  year: number;
  month: number;
}

// --- Utility functions ---

function formatKRW(n: number): string {
  if (n === 0) return "0원";
  if (Math.abs(n) >= 100_000_000) {
    return `${(n / 100_000_000).toFixed(1)}억원`;
  }
  if (Math.abs(n) >= 10_000) {
    return `${Math.round(n / 10_000).toLocaleString()}만원`;
  }
  return `${n.toLocaleString()}원`;
}

function formatCompact(n: number): string {
  if (n === 0) return "0";
  if (Math.abs(n) >= 10_000) {
    return `${Math.round(n / 10_000)}만`;
  }
  return n.toLocaleString();
}

function getStatusInfo(
  item: BudgetVsActual,
  isRevenue: boolean
): { label: string; color: string; bgColor: string } {
  if (item.targetAmount === 0) {
    return { label: "미설정", color: "text-muted-foreground", bgColor: "bg-muted" };
  }
  const rate = item.achievementRate;

  if (isRevenue) {
    if (rate >= 100) return { label: "달성", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950" };
    if (rate >= 80) return { label: "양호", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950" };
    return { label: "부족", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950" };
  }
  // Expense: under budget is good
  if (rate <= 80) return { label: "절약", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950" };
  if (rate <= 100) return { label: "적정", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950" };
  return { label: "초과", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950" };
}

// --- Circular Progress Component ---

function CircularProgress({
  percentage,
  size = 56,
  strokeWidth = 5,
  isRevenue = false,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isRevenue?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(Math.max(percentage, 0), 150);
  const offset = circumference - (clampedPct / 100) * circumference;

  // Color logic: revenue >100 = green, expense >100 = red
  let strokeClass: string;
  if (isRevenue) {
    strokeClass =
      percentage >= 100
        ? "stroke-emerald-500"
        : percentage >= 80
          ? "stroke-blue-500"
          : "stroke-amber-500";
  } else {
    strokeClass =
      percentage > 100
        ? "stroke-red-500"
        : percentage > 80
          ? "stroke-amber-500"
          : "stroke-emerald-500";
  }

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="stroke-muted"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={strokeClass}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={Math.max(offset, 0)}
        strokeLinecap="round"
      />
    </svg>
  );
}

// --- KPI Summary Cards ---

function KPISummary({
  pageData,
  comparison,
}: {
  pageData: BudgetPageData;
  comparison: BudgetVsActual[];
}) {
  const revenueItem = comparison.find((c) => c.category === "매출");
  const totalBudgetExpense = comparison
    .filter((c) => c.category !== "매출")
    .reduce((s, c) => s + c.targetAmount, 0);
  const totalActualExpense = comparison
    .filter((c) => c.category !== "매출")
    .reduce((s, c) => s + c.actualAmount, 0);
  const expenseRate =
    totalBudgetExpense > 0
      ? Math.round((totalActualExpense / totalBudgetExpense) * 100)
      : 0;
  const remainingBudget = totalBudgetExpense - totalActualExpense;

  const revenueDelta =
    pageData.prevMonthTotalRevenue > 0
      ? ((pageData.currentMonthTotalRevenue - pageData.prevMonthTotalRevenue) /
          pageData.prevMonthTotalRevenue) *
        100
      : 0;

  const kpis = [
    {
      title: "매출 목표 달성률",
      value: revenueItem ? `${revenueItem.achievementRate}%` : "미설정",
      sub: revenueItem
        ? `${formatKRW(revenueItem.actualAmount)} / ${formatKRW(revenueItem.targetAmount)}`
        : "예산을 설정해 주세요",
      icon: Target,
      progress: revenueItem?.achievementRate ?? 0,
      isRevenue: true,
    },
    {
      title: "지출 예산 소진률",
      value: totalBudgetExpense > 0 ? `${expenseRate}%` : "미설정",
      sub:
        totalBudgetExpense > 0
          ? `${formatKRW(totalActualExpense)} / ${formatKRW(totalBudgetExpense)}`
          : "지출 예산을 설정해 주세요",
      icon: Wallet,
      progress: expenseRate,
      isRevenue: false,
    },
    {
      title: "잔여 예산",
      value: totalBudgetExpense > 0 ? formatKRW(remainingBudget) : "-",
      sub:
        remainingBudget > 0
          ? "아직 여유 있어요"
          : remainingBudget < 0
            ? "예산을 초과했어요"
            : "딱 맞게 사용했어요",
      icon: DollarSign,
      highlight: remainingBudget < 0,
    },
    {
      title: "전월 대비",
      value:
        revenueDelta !== 0
          ? `${revenueDelta > 0 ? "+" : ""}${revenueDelta.toFixed(1)}%`
          : "-",
      sub:
        pageData.prevMonthTotalRevenue > 0
          ? `전월 매출 ${formatKRW(pageData.prevMonthTotalRevenue)}`
          : "전월 데이터 없음",
      icon: revenueDelta >= 0 ? TrendingUp : TrendingDown,
      isPositive: revenueDelta >= 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {kpi.title}
                </p>
                <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.sub}</p>
              </div>
              {kpi.progress !== undefined ? (
                <div className="relative flex items-center justify-center">
                  <CircularProgress
                    percentage={kpi.progress}
                    size={48}
                    strokeWidth={4}
                    isRevenue={kpi.isRevenue}
                  />
                  <span className="absolute text-[10px] font-semibold rotate-90">
                    {kpi.progress}%
                  </span>
                </div>
              ) : (
                <div
                  className={`rounded-lg p-2 ${
                    kpi.highlight
                      ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                      : kpi.isPositive !== undefined
                        ? kpi.isPositive
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <kpi.icon className="h-5 w-5" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Budget vs Actual Chart ---

function BudgetChart({ comparison }: { comparison: BudgetVsActual[] }) {
  const chartData = comparison
    .filter((c) => c.targetAmount > 0 || c.actualAmount > 0)
    .map((c) => ({
      name: c.category,
      예산: c.targetAmount,
      실적: c.actualAmount,
      isRevenue: c.category === "매출",
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">예산 vs 실적</CardTitle>
          <CardDescription>
            카테고리별 예산을 설정하면 차트가 표시됩니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            아래에서 예산을 설정해 보세요
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">예산 vs 실적</CardTitle>
        <CardDescription>카테고리별 목표 대비 실적 비교</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tickFormatter={(v: number) => formatCompact(v)}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <Tooltip
              formatter={(value) => formatKRW(Number(value))}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Bar dataKey="예산" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`budget-${index}`}
                  className="fill-muted-foreground/30"
                />
              ))}
            </Bar>
            <Bar dataKey="실적" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`actual-${index}`}
                  className={
                    entry.isRevenue
                      ? "fill-[var(--color-chart-1)]"
                      : "fill-[var(--color-chart-4)]"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// --- Category Budget Card ---

function CategoryCard({
  category,
  item,
  avgAmount,
  onSave,
  saving,
}: {
  category: (typeof CATEGORIES)[number];
  item: BudgetVsActual | undefined;
  avgAmount: number;
  onSave: (category: string, amount: number) => Promise<void>;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const Icon = category.icon;

  const status = item
    ? getStatusInfo(item, category.isRevenue)
    : { label: "미설정", color: "text-muted-foreground", bgColor: "bg-muted" };

  const handleEdit = useCallback(() => {
    setEditValue(item?.targetAmount ? String(item.targetAmount) : "");
    setEditing(true);
  }, [item]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setEditValue("");
  }, []);

  const handleSave = useCallback(async () => {
    const amount = Number(editValue);
    if (isNaN(amount) || amount < 0) return;
    await onSave(category.key, amount);
    setEditing(false);
  }, [editValue, category.key, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") handleCancel();
    },
    [handleSave, handleCancel]
  );

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon + Mini progress */}
          <div className="relative shrink-0">
            <div className="rounded-lg bg-muted p-2.5">
              <Icon className="h-4 w-4 text-foreground/70" />
            </div>
            {item && item.targetAmount > 0 && (
              <div className="absolute -bottom-1 -right-1">
                <CircularProgress
                  percentage={item.achievementRate}
                  size={24}
                  strokeWidth={2.5}
                  isRevenue={category.isRevenue}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{category.label}</h3>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 h-4 ${status.color} ${status.bgColor} border-0`}
                >
                  {status.label}
                </Badge>
              </div>

              {!editing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleEdit}
                  aria-label={`${category.label} 예산 편집`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Budget display or edit */}
            {editing ? (
              <div className="flex items-center gap-1.5 mt-2">
                <Input
                  type="number"
                  className="h-8 text-sm w-full"
                  placeholder="목표 금액 (원)"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={handleSave}
                  disabled={saving}
                  aria-label="저장"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleCancel}
                  aria-label="취소"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-1.5">
                {item && item.targetAmount > 0 ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold">
                        {formatKRW(item.actualAmount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {formatKRW(item.targetAmount)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          category.isRevenue
                            ? item.achievementRate >= 100
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                            : item.achievementRate > 100
                              ? "bg-red-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, item.achievementRate)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-muted-foreground">
                        달성률 {item.achievementRate}%
                      </span>
                      {item.variance !== 0 && (
                        <span
                          className={`text-[11px] flex items-center gap-0.5 ${
                            (category.isRevenue && item.variance > 0) ||
                            (!category.isRevenue && item.variance < 0)
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {item.variance > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatKRW(Math.abs(item.variance))}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-0.5"
                  >
                    클릭하여 예산 설정 &rarr;
                  </button>
                )}
              </div>
            )}

            {/* 3-month average reference */}
            {avgAmount > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1.5 border-t border-border/50 pt-1.5">
                평균 실적: {formatKRW(avgAmount)} (최근 3개월)
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Quick Insights ---

function QuickInsights({
  comparison,
  categoryAverages,
}: {
  comparison: BudgetVsActual[];
  categoryAverages: { category: string; avgAmount: number }[];
}) {
  const insights = useMemo(() => {
    const result: string[] = [];

    // Find over-budget expense categories
    for (const item of comparison) {
      if (item.category === "매출" || item.targetAmount === 0) continue;
      if (item.achievementRate > 110) {
        const avg = categoryAverages.find(
          (a) => a.category === item.category
        );
        if (avg && avg.avgAmount > 0) {
          const diff = item.actualAmount - avg.avgAmount;
          if (diff > 0) {
            result.push(
              `${item.category}이(가) 예산의 ${item.achievementRate}%입니다. 지난 3개월 평균보다 ${formatKRW(diff)} 높아요.`
            );
          } else {
            result.push(
              `${item.category}이(가) 예산의 ${item.achievementRate}%로 초과되었어요.`
            );
          }
        } else {
          result.push(
            `${item.category}이(가) 예산의 ${item.achievementRate}%로 초과 사용 중이에요.`
          );
        }
      }
    }

    // Revenue achievement insight
    const revenue = comparison.find((c) => c.category === "매출");
    if (revenue && revenue.targetAmount > 0) {
      if (revenue.achievementRate >= 100) {
        result.push(
          `매출 목표를 달성했어요! 목표 대비 ${formatKRW(revenue.variance)} 초과 달성이에요.`
        );
      } else if (revenue.achievementRate >= 80) {
        result.push(
          `매출이 목표의 ${revenue.achievementRate}%에요. ${formatKRW(revenue.targetAmount - revenue.actualAmount)}만 더 달성하면 목표 완료!`
        );
      }
    }

    // Find categories with good savings
    for (const item of comparison) {
      if (item.category === "매출" || item.targetAmount === 0) continue;
      if (item.achievementRate > 0 && item.achievementRate <= 60) {
        result.push(
          `${item.category}을(를) 알뜰하게 관리하고 있어요 (예산의 ${item.achievementRate}%).`
        );
        break; // Only one savings insight
      }
    }

    return result.slice(0, 3); // Max 3 insights
  }, [comparison, categoryAverages]);

  if (insights.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-2 shrink-0">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">AI 인사이트</p>
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {insight}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export function BudgetManager({
  businessId,
  pageData,
  year,
  month,
}: BudgetManagerProps) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = useCallback(
    async (category: string, amount: number) => {
      setSaving(category);
      try {
        await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            year,
            month,
            category,
            targetAmount: amount,
          }),
        });
        router.refresh();
      } finally {
        setSaving(null);
      }
    },
    [businessId, year, month, router]
  );

  const avgMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of pageData.categoryAverages) {
      m[a.category] = a.avgAmount;
    }
    return m;
  }, [pageData.categoryAverages]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">예산 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {year}년 {month}월 예산 목표와 실적을 한눈에 확인하세요
        </p>
      </div>

      {/* KPI Summary Strip */}
      <KPISummary pageData={pageData} comparison={pageData.comparison} />

      {/* Budget vs Actual Chart */}
      <BudgetChart comparison={pageData.comparison} />

      {/* Category Budget Cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">카테고리별 예산</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const item = pageData.comparison.find(
              (c) => c.category === cat.key
            );
            return (
              <CategoryCard
                key={cat.key}
                category={cat}
                item={item}
                avgAmount={avgMap[cat.key] ?? 0}
                onSave={handleSave}
                saving={saving === cat.key}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Insights */}
      <QuickInsights
        comparison={pageData.comparison}
        categoryAverages={pageData.categoryAverages}
      />
    </div>
  );
}
