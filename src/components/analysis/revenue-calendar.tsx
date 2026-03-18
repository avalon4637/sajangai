"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DailyRevenueSummary } from "@/lib/queries/daily-revenue";

interface RevenueCalendarProps {
  data: DailyRevenueSummary[];
  yearMonth: string;
  onDateSelect?: (date: string, data: DailyRevenueSummary | null) => void;
}

function formatCompact(amount: number): string {
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

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

export function RevenueCalendar({
  data,
  yearMonth,
  onDateSelect,
}: RevenueCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { calendarDays, maxAmount, weeklyTotals } = useMemo(() => {
    const [year, month] = yearMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Build lookup map
    const dataMap = new Map<string, DailyRevenueSummary>();
    let max = 0;
    for (const d of data) {
      dataMap.set(d.date, d);
      if (d.totalAmount > max) max = d.totalAmount;
    }

    // Build calendar grid
    const days: (null | { day: number; date: string; data: DailyRevenueSummary | null })[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yearMonth}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, date: dateStr, data: dataMap.get(dateStr) ?? null });
    }

    // Calculate weekly totals
    const weeks: number[][] = [];
    let currentWeek: number[] = [];
    for (let i = 0; i < days.length; i++) {
      currentWeek.push(days[i]?.data?.totalAmount ?? 0);
      if ((i + 1) % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const totals = weeks.map((week) => week.reduce((sum, a) => sum + a, 0));

    return { calendarDays: days, maxAmount: max, weeklyTotals: totals };
  }, [data, yearMonth]);

  const handleDateClick = (date: string, dayData: DailyRevenueSummary | null) => {
    setSelectedDate(date === selectedDate ? null : date);
    onDateSelect?.(date, dayData);
  };

  // Split into weeks
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">일별 매출 달력</CardTitle>
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

              const { day, date, data: dayData } = cell;
              const amount = dayData?.totalAmount ?? 0;
              const count = dayData?.transactionCount ?? 0;
              const isSelected = date === selectedDate;
              const isToday = date === today;
              const dayOfWeek = (weekIdx === 0 ? cellIdx : cellIdx) % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleDateClick(date, dayData)}
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
                        isToday && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center",
                        isSunday && !isToday && "text-red-500",
                        isSaturday && !isToday && "text-blue-500"
                      )}
                    >
                      {day}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {count}건
                      </span>
                    )}
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

        {/* Heat map legend */}
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
  );
}

// Daily detail panel shown when a date is selected
interface DailyDetailProps {
  date: string;
  data: DailyRevenueSummary;
}

export function DailyDetailPanel({ date, data }: DailyDetailProps) {
  const dayName = DAY_HEADERS[new Date(date).getDay()];
  const dateFormatted = `${date.slice(5, 7)}/${date.slice(8, 10)} (${dayName})`;

  const sortedChannels = Object.entries(data.channels).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>{dateFormatted}</span>
          <Badge variant="secondary">{data.transactionCount}건</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold">
            {data.totalAmount.toLocaleString()}원
          </div>
        </div>

        {sortedChannels.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">
              채널별 매출
            </div>
            {sortedChannels.map(([channel, amount]) => {
              const percent = Math.round((amount / data.totalAmount) * 100);
              return (
                <div key={channel} className="flex items-center gap-2">
                  <div className="flex-1 text-sm">{channel}</div>
                  <div className="text-sm font-medium">
                    {formatCompact(amount)}원
                  </div>
                  <div className="text-xs text-muted-foreground w-8 text-right">
                    {percent}%
                  </div>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
