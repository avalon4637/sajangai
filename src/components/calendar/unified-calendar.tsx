"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/utils/format-currency";

export interface DailyAmount {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface FixedCostDay {
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
}

interface UnifiedCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  dailyRevenues: DailyAmount[];
  dailyExpenses: DailyAmount[];
  fixedCostDays: FixedCostDay[];
  onDayClick: (date: string) => void;
  selectedDate?: string | null;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** Get YYYY-MM-DD string from year/month/day */
function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Get the last day of a given month */
function getLastDay(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface DayCellData {
  day: number;
  dateStr: string;
  revenue: number;
  expense: number;
  hasFixedCost: boolean;
  isCurrentMonth: boolean;
}

export function UnifiedCalendar({
  month,
  onMonthChange,
  dailyRevenues,
  dailyExpenses,
  fixedCostDays,
  onDayClick,
  selectedDate,
}: UnifiedCalendarProps) {
  const year = month.getFullYear();
  const monthIdx = month.getMonth();

  // Build lookup maps for O(1) access
  const revenueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of dailyRevenues) {
      map.set(r.date, (map.get(r.date) ?? 0) + r.amount);
    }
    return map;
  }, [dailyRevenues]);

  const expenseMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of dailyExpenses) {
      map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
    }
    return map;
  }, [dailyExpenses]);

  const fixedCostSet = useMemo(() => {
    return new Set(fixedCostDays.map((f) => f.date));
  }, [fixedCostDays]);

  // Monthly totals
  const monthlyRevenue = useMemo(
    () => dailyRevenues.reduce((s, r) => s + r.amount, 0),
    [dailyRevenues]
  );
  const monthlyExpense = useMemo(
    () => dailyExpenses.reduce((s, e) => s + e.amount, 0),
    [dailyExpenses]
  );

  // Build calendar grid (6 weeks max)
  const weeks = useMemo(() => {
    const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
    const lastDay = getLastDay(year, monthIdx);
    const rows: (DayCellData | null)[][] = [];
    let currentWeek: (DayCellData | null)[] = [];

    // Pad leading empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = toDateStr(year, monthIdx, day);
      currentWeek.push({
        day,
        dateStr,
        revenue: revenueMap.get(dateStr) ?? 0,
        expense: expenseMap.get(dateStr) ?? 0,
        hasFixedCost: fixedCostSet.has(dateStr),
        isCurrentMonth: true,
      });
      if (currentWeek.length === 7) {
        rows.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad trailing empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      rows.push(currentWeek);
    }

    return rows;
  }, [year, monthIdx, revenueMap, expenseMap, fixedCostSet]);

  // Weekly totals for the "주간" column
  const weeklyTotals = useMemo(() => {
    return weeks.map((week) => {
      let rev = 0;
      let exp = 0;
      for (const cell of week) {
        if (cell) {
          rev += cell.revenue;
          exp += cell.expense;
        }
      }
      return { revenue: rev, expense: exp };
    });
  }, [weeks]);

  function prevMonth() {
    onMonthChange(new Date(year, monthIdx - 1, 1));
  }

  function nextMonth() {
    onMonthChange(new Date(year, monthIdx + 1, 1));
  }

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="w-full overflow-x-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="cursor-pointer">
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-lg font-bold whitespace-nowrap">
            {year}년 {monthIdx + 1}월
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="cursor-pointer">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-emerald-600 font-medium">
            월 매출: {formatKRW(monthlyRevenue)}
          </span>
          <span className="text-red-500 font-medium">
            월 지출: {formatKRW(monthlyExpense)}
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "text-center text-xs font-medium py-2",
                i === 0 && "text-red-400",
                i === 6 && "text-blue-400"
              )}
            >
              {label}
            </div>
          ))}
          <div className="text-center text-xs font-medium py-2 text-gray-500 border-l">
            주간
          </div>
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className={cn("grid grid-cols-8", wi < weeks.length - 1 && "border-b")}>
            {week.map((cell, ci) => {
              if (!cell) {
                return <div key={ci} className="min-h-[72px] md:min-h-[88px] border-r last:border-r-0 bg-gray-50/50" />;
              }
              const net = cell.revenue - cell.expense;
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;

              return (
                <div
                  key={ci}
                  onClick={() => onDayClick(cell.dateStr)}
                  className={cn(
                    "min-h-[72px] md:min-h-[88px] p-1 md:p-1.5 cursor-pointer transition-colors border-r last:border-r-0",
                    "hover:bg-blue-50/60",
                    isSelected && "bg-blue-50 ring-1 ring-blue-300 ring-inset",
                    isToday && !isSelected && "bg-amber-50/40"
                  )}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        ci === 0 && "text-red-500",
                        ci === 6 && "text-blue-500",
                        isToday && "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                      )}
                    >
                      {cell.day}
                    </span>
                    {cell.hasFixedCost && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" title="고정비 자동 반영" />
                    )}
                  </div>

                  {/* Revenue */}
                  {cell.revenue > 0 && (
                    <p className="text-[10px] md:text-xs text-emerald-600 font-medium truncate leading-tight">
                      +{formatKRW(cell.revenue)}
                    </p>
                  )}

                  {/* Expense */}
                  {cell.expense > 0 && (
                    <p className="text-[10px] md:text-xs text-red-500 font-medium truncate leading-tight">
                      -{formatKRW(cell.expense)}
                    </p>
                  )}

                  {/* Net indicator (only when both exist) */}
                  {cell.revenue > 0 && cell.expense > 0 && (
                    <p
                      className={cn(
                        "text-[9px] md:text-[10px] font-medium truncate leading-tight mt-0.5",
                        net >= 0 ? "text-emerald-500" : "text-red-400"
                      )}
                    >
                      {net >= 0 ? "+" : ""}
                      {formatKRW(net)}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Weekly total column */}
            <div className="min-h-[72px] md:min-h-[88px] p-1 md:p-1.5 border-l bg-gray-50/50">
              <p className="text-[10px] text-gray-400 mb-0.5">합계</p>
              {weeklyTotals[wi].revenue > 0 && (
                <p className="text-[10px] md:text-xs text-emerald-600 font-medium truncate leading-tight">
                  +{formatKRW(weeklyTotals[wi].revenue)}
                </p>
              )}
              {weeklyTotals[wi].expense > 0 && (
                <p className="text-[10px] md:text-xs text-red-500 font-medium truncate leading-tight">
                  -{formatKRW(weeklyTotals[wi].expense)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
          고정비 자동 반영
        </span>
        <span className="text-emerald-600">+매출</span>
        <span className="text-red-500">-지출</span>
      </div>
    </div>
  );
}
