"use client";

import * as React from "react";
import { ko } from "date-fns/locale";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

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

function getHeatmapColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return "bg-muted/40";
  const ratio = amount / max;
  if (ratio < 0.2) return "bg-blue-50 dark:bg-blue-950/30";
  if (ratio < 0.4) return "bg-blue-100 dark:bg-blue-900/40";
  if (ratio < 0.6) return "bg-blue-200 dark:bg-blue-800/50";
  if (ratio < 0.8) return "bg-blue-400 text-white dark:bg-blue-600";
  return "bg-blue-600 text-white dark:bg-blue-500";
}

function getTextColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return "text-muted-foreground";
  const ratio = amount / max;
  if (ratio >= 0.6) return "text-white";
  if (ratio >= 0.4) return "text-blue-900 dark:text-blue-100";
  return "text-blue-700 dark:text-blue-300";
}

function formatAmount(amount: number): string {
  if (amount === 0) return "-";
  if (amount >= 10000) return `${Math.round(amount / 10000)}만`;
  if (amount >= 1000) return `${(amount / 10000).toFixed(1)}만`;
  return `${amount.toLocaleString()}`;
}

export function RevenueCalendar({
  month,
  onMonthChange,
  dailyRevenues,
  onDayClick,
}: RevenueCalendarProps) {
  const revenueMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const r of dailyRevenues) {
      map.set(r.date, r.amount);
    }
    return map;
  }, [dailyRevenues]);

  const maxRevenue = React.useMemo(() => {
    if (dailyRevenues.length === 0) return 0;
    return Math.max(...dailyRevenues.map((r) => r.amount));
  }, [dailyRevenues]);

  const totalRevenue = React.useMemo(
    () => dailyRevenues.reduce((sum, r) => sum + r.amount, 0),
    [dailyRevenues]
  );

  const businessDays = React.useMemo(
    () => dailyRevenues.filter((r) => r.amount > 0).length,
    [dailyRevenues]
  );

  const avgRevenue = businessDays > 0 ? totalRevenue / businessDays : 0;

  const defaultClassNames = getDefaultClassNames();

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
          <p className="text-lg font-bold">{formatAmount(avgRevenue)}원</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border bg-card p-4">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={onMonthChange}
          locale={ko}
          showOutsideDays={false}
          className="w-full"
          classNames={{
            root: cn("w-full", defaultClassNames.root),
            months: cn("flex flex-col w-full", defaultClassNames.months),
            month: cn("flex flex-col w-full gap-2", defaultClassNames.month),
            nav: cn(
              "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
              defaultClassNames.nav
            ),
            button_previous: cn(
              buttonVariants({ variant: "ghost" }),
              "size-8 p-0",
              defaultClassNames.button_previous
            ),
            button_next: cn(
              buttonVariants({ variant: "ghost" }),
              "size-8 p-0",
              defaultClassNames.button_next
            ),
            month_caption: cn(
              "flex items-center justify-center h-8 w-full px-8",
              defaultClassNames.month_caption
            ),
            caption_label: "text-sm font-semibold",
            table: "w-full border-collapse",
            weekdays: cn("flex", defaultClassNames.weekdays),
            weekday: cn(
              "text-muted-foreground flex-1 font-normal text-xs text-center py-2",
              defaultClassNames.weekday
            ),
            week: cn("flex w-full gap-1 mt-1", defaultClassNames.week),
            day: cn(
              "relative flex-1 p-0 text-center select-none",
              defaultClassNames.day
            ),
            outside: "invisible",
            today: "",
          }}
          components={{
            Chevron: ({ orientation, ...props }) =>
              orientation === "left" ? (
                <ChevronLeftIcon className="size-4" {...props} />
              ) : (
                <ChevronRightIcon className="size-4" {...props} />
              ),
            DayButton: ({ day, modifiers, ...props }) => {
              const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`;
              const amount = revenueMap.get(dateStr) ?? 0;
              const bgColor = getHeatmapColor(amount, maxRevenue);
              const txtColor = getTextColor(amount, maxRevenue);
              const isToday =
                day.date.toDateString() === new Date().toDateString();
              const isSunday = day.date.getDay() === 0;
              const isSaturday = day.date.getDay() === 6;

              return (
                <button
                  type="button"
                  onClick={() => onDayClick?.(day.date, amount)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full aspect-[4/3] rounded-md transition-colors gap-0.5 min-h-[60px]",
                    bgColor,
                    isToday && "ring-2 ring-primary ring-offset-1"
                  )}
                  {...props}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      txtColor,
                      isSunday && amount === 0 && "text-red-400",
                      isSaturday && amount === 0 && "text-blue-400"
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  <span className={cn("text-[10px] font-semibold", txtColor)}>
                    {formatAmount(amount)}
                  </span>
                </button>
              );
            },
          }}
        />

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t justify-center flex-wrap">
          <span className="text-xs text-muted-foreground">매출 강도:</span>
          {[
            { color: "bg-muted/40", label: "휴무" },
            { color: "bg-blue-50", label: "~20%" },
            { color: "bg-blue-100", label: "~40%" },
            { color: "bg-blue-200", label: "~60%" },
            { color: "bg-blue-400", label: "~80%" },
            { color: "bg-blue-600", label: "최고" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div
                className={cn("w-3 h-3 rounded-sm border", item.color)}
              />
              <span className="text-[10px] text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
