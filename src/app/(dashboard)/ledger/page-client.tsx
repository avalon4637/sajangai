"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, TrendingUp, TrendingDown, BarChart3, Wallet } from "lucide-react";

import { UnifiedCalendar, type DailyAmount, type FixedCostDay } from "@/components/calendar/unified-calendar";
import { DayDetailSheet } from "@/components/calendar/day-detail-sheet";
import { formatKRW } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils";
import type { Revenue, Expense } from "@/types/data-entry";

interface LedgerPageClientProps {
  initialMonth: string; // YYYY-MM
  revenues: Revenue[];
  expenses: Expense[];
  dailyRevenues: DailyAmount[];
  dailyExpenses: DailyAmount[];
  fixedCostDays: FixedCostDay[];
}

export function LedgerPageClient({
  initialMonth,
  revenues,
  expenses,
  dailyRevenues,
  dailyExpenses,
  fixedCostDays,
}: LedgerPageClientProps) {
  const router = useRouter();
  const [yearStr, monthStr] = initialMonth.split("-");
  const [month, setMonth] = useState(
    new Date(Number(yearStr), Number(monthStr) - 1, 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // KPI calculations
  const totalRevenue = useMemo(
    () => dailyRevenues.reduce((s, r) => s + r.amount, 0),
    [dailyRevenues]
  );
  const totalExpense = useMemo(
    () => dailyExpenses.reduce((s, e) => s + e.amount, 0),
    [dailyExpenses]
  );
  const totalFixedCost = useMemo(
    () => fixedCostDays.reduce((s, f) => s + f.amount, 0),
    [fixedCostDays]
  );
  const netProfit = totalRevenue - totalExpense;

  // Get revenues/expenses for the selected day
  const dayRevenues = useMemo(() => {
    if (!selectedDate) return [];
    return revenues.filter((r) => r.date === selectedDate);
  }, [revenues, selectedDate]);

  const dayExpenses = useMemo(() => {
    if (!selectedDate) return [];
    // Real expenses
    const real = expenses
      .filter((e) => e.date === selectedDate)
      .map((e) => ({ ...e, isFixedCost: false }));
    // Fixed cost virtual entries
    const fixed = fixedCostDays
      .filter((f) => f.date === selectedDate)
      .map((f, i) => ({
        id: `fc-${i}`,
        date: f.date,
        amount: f.amount,
        type: "fixed" as const,
        category: f.category,
        memo: null,
        isFixedCost: true,
      }));
    return [...real, ...fixed];
  }, [expenses, fixedCostDays, selectedDate]);

  const handleMonthChange = useCallback(
    (newMonth: Date) => {
      setMonth(newMonth);
      const ym = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, "0")}`;
      router.push(`/ledger?month=${ym}`);
    },
    [router]
  );

  const handleDayClick = useCallback((date: string) => {
    setSelectedDate(date);
    setSheetOpen(true);
  }, []);

  const handleDataChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Calendar className="size-5 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold">매출/매입</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            캘린더에서 일별 매출과 지출을 한눈에 확인하세요
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp className="size-4" />}
          label="월 매출"
          value={formatKRW(totalRevenue)}
          color="emerald"
        />
        <KpiCard
          icon={<TrendingDown className="size-4" />}
          label="월 지출"
          value={formatKRW(totalExpense)}
          color="red"
        />
        <KpiCard
          icon={<BarChart3 className="size-4" />}
          label="순이익"
          value={`${netProfit >= 0 ? "+" : ""}${formatKRW(netProfit)}`}
          color={netProfit >= 0 ? "emerald" : "red"}
        />
        <KpiCard
          icon={<Wallet className="size-4" />}
          label="고정비"
          value={formatKRW(totalFixedCost)}
          color="orange"
        />
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border p-4 md:p-6">
        <UnifiedCalendar
          month={month}
          onMonthChange={handleMonthChange}
          dailyRevenues={dailyRevenues}
          dailyExpenses={dailyExpenses}
          fixedCostDays={fixedCostDays}
          onDayClick={handleDayClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* Day detail sheet */}
      {selectedDate && (
        <DayDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          date={selectedDate}
          revenues={dayRevenues}
          expenses={dayExpenses}
          onDataChanged={handleDataChanged}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "red" | "orange" | "blue";
}) {
  const colorClasses = {
    emerald: "text-emerald-600 bg-emerald-50",
    red: "text-red-500 bg-red-50",
    orange: "text-orange-600 bg-orange-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("p-1 rounded-lg", colorClasses[color])}>
          {icon}
        </span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={cn("text-base font-bold", colorClasses[color].split(" ")[0])}>
        {value}
      </p>
    </div>
  );
}
