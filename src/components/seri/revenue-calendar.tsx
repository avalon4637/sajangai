"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DailyRevenue {
  date: string; // yyyy-MM-dd
  amount: number;
}

interface RevenueCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  dailyRevenues: DailyRevenue[];
  onDayClick?: (date: Date, amount: number) => void;
}

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function formatCompact(amount: number): string {
  if (amount === 0) return "-";
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.round(amount / 10_000).toLocaleString()}만`;
  return amount.toLocaleString();
}

function getHeatColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return "";
  const ratio = amount / max;
  if (ratio >= 0.8) return "bg-emerald-500/20 dark:bg-emerald-500/30";
  if (ratio >= 0.6) return "bg-emerald-400/15 dark:bg-emerald-400/25";
  if (ratio >= 0.4) return "bg-emerald-300/15 dark:bg-emerald-300/20";
  if (ratio >= 0.2) return "bg-emerald-200/20 dark:bg-emerald-200/15";
  return "bg-emerald-100/20 dark:bg-emerald-100/10";
}

export function RevenueCalendar({
  month,
  onMonthChange,
  dailyRevenues,
  onDayClick,
}: RevenueCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const yearMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;

  const { calendarDays, maxAmount, weeklyTotals, totalRevenue, businessDays, avgRevenue } =
    useMemo(() => {
      const [year, m] = yearMonth.split("-").map(Number);
      const firstDay = new Date(year, m - 1, 1).getDay();
      const daysInMonth = new Date(year, m, 0).getDate();

      // Build lookup map
      const dataMap = new Map<string, number>();
      let max = 0;
      for (const r of dailyRevenues) {
        dataMap.set(r.date, r.amount);
        if (r.amount > max) max = r.amount;
      }

      // Build calendar grid
      const days: (null | { day: number; date: string; amount: number })[] = [];

      // Leading empty cells
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Actual days
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${yearMonth}-${String(d).padStart(2, "0")}`;
        days.push({ day: d, date: dateStr, amount: dataMap.get(dateStr) ?? 0 });
      }

      // Calculate weekly totals
      const weeks: number[][] = [];
      let currentWeek: number[] = [];
      for (let i = 0; i < days.length; i++) {
        currentWeek.push(days[i]?.amount ?? 0);
        if ((i + 1) % 7 === 0) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }
      const totals = weeks.map((week) => week.reduce((sum, a) => sum + a, 0));

      // KPI stats
      const total = dailyRevenues.reduce((sum, r) => sum + r.amount, 0);
      const activeDays = dailyRevenues.filter((r) => r.amount > 0).length;
      const avg = activeDays > 0 ? total / activeDays : 0;

      return {
        calendarDays: days,
        maxAmount: max,
        weeklyTotals: totals,
        totalRevenue: total,
        businessDays: activeDays,
        avgRevenue: avg,
      };
    }, [dailyRevenues, yearMonth]);

  // Split into weeks
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const today = new Date().toISOString().slice(0, 10);

  const handleDayClick = (date: string, amount: number, dayDate: Date) => {
    setSelectedDate(date === selectedDate ? null : date);
    onDayClick?.(dayDate, amount);
  };

  const handlePrevMonth = () => {
    const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    onMonthChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    onMonthChange(next);
  };

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">월 총 매출</p>
          <p className="text-lg font-bold">
            {totalRevenue.toLocaleString("ko-KR")}원
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">영업일수</p>
          <p className="text-lg font-bold">{businessDays}일</p>
        </div>
        <div className="rounded-lg border bg-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">일평균</p>
          <p className="text-lg font-bold">{formatCompact(avgRevenue)}원</p>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-sm cursor-pointer"
              aria-label="이전 달"
            >
              &#8249;
            </button>
            <CardTitle className="text-base">
              {month.getFullYear()}년 {month.getMonth() + 1}월 일별 매출
            </CardTitle>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-sm cursor-pointer"
              aria-label="다음 달"
            >
              &#8250;
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            {DAY_HEADERS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  "text-center text-xs font-medium py-1.5",
                  i === 0 && "text-red-500",
                  i === 6 && "text-blue-500"
                )}
              >
                {label}
              </div>
            ))}
            <div className="text-center text-xs font-medium py-1.5 text-muted-foreground">
              주간
            </div>
          </div>

          {/* Calendar grid */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-8 gap-1 mb-1">
              {week.map((cell, cellIdx) => {
                if (!cell) {
                  return <div key={`empty-${cellIdx}`} className="min-h-[72px]" />;
                }

                const { day, date, amount } = cell;
                const isSelected = date === selectedDate;
                const isToday = date === today;
                const isSunday = cellIdx === 0;
                const isSaturday = cellIdx === 6;
                const dayDate = new Date(date);

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleDayClick(date, amount, dayDate)}
                    className={cn(
                      "min-h-[72px] rounded-md border text-left p-1.5 transition-all hover:border-primary/50 cursor-pointer",
                      amount > 0 && getHeatColor(amount, maxAmount),
                      isSelected && "ring-2 ring-primary border-primary",
                      isToday && "border-primary/70",
                      !amount && "border-dashed border-muted"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isToday &&
                            "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center",
                          isSunday && !isToday && "text-red-500",
                          isSaturday && !isToday && "text-blue-500"
                        )}
                      >
                        {day}
                      </span>
                    </div>
                    {amount > 0 && (
                      <div className="mt-1">
                        <div className="text-xs font-semibold truncate">
                          {formatCompact(amount)}원
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
              {/* Weekly total */}
              <div className="min-h-[72px] rounded-md bg-muted/50 p-1.5 flex flex-col justify-center items-center">
                {weeklyTotals[weekIdx] > 0 ? (
                  <>
                    <div className="text-[10px] text-muted-foreground">합계</div>
                    <div className="text-xs font-semibold">
                      {formatCompact(weeklyTotals[weekIdx])}
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-muted-foreground">-</div>
                )}
              </div>
            </div>
          ))}

          {/* Heatmap legend */}
          <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
            <span>적음</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-100/30 border" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200/30 border" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300/30 border" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400/30 border" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border" />
            <span>많음</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
