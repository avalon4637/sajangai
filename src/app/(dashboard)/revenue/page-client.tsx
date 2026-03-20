"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, List, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/data-entry/month-picker";
import { RevenueForm } from "@/components/data-entry/revenue-form";
import { RevenueTable } from "@/components/data-entry/revenue-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  RevenueCalendar,
  type DailyRevenue,
} from "@/components/seri/revenue-calendar";
import type { Revenue } from "@/types/data-entry";

interface RevenuePageClientProps {
  revenues: Revenue[];
}

export function RevenuePageClient({ revenues }: RevenuePageClientProps) {
  const [editingRevenue, setEditingRevenue] = useState<Revenue | undefined>(
    undefined
  );
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMonthStr = searchParams.get("month");
  const now = new Date();
  const calendarMonth = useMemo(() => {
    if (currentMonthStr) {
      const [y, m] = currentMonthStr.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [currentMonthStr]);

  const totalAmount = revenues.reduce((sum, r) => sum + r.amount, 0);

  const dailyRevenues: DailyRevenue[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of revenues) {
      const dateStr = r.date;
      map.set(dateStr, (map.get(dateStr) ?? 0) + r.amount);
    }
    return Array.from(map.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  }, [revenues]);

  function handleMonthChange(newMonth: Date): void {
    const monthStr = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/revenue?month=${monthStr}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <MonthPicker basePath="/revenue" />
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">
            월 매출 합계:{" "}
            <span className="text-primary">
              {totalAmount.toLocaleString("ko-KR")}원
            </span>
          </div>
          <div className="flex border rounded-md">
            <Button
              variant={view === "calendar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className="h-8 px-2"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {view === "calendar" ? (
        <RevenueCalendar
          month={calendarMonth}
          onMonthChange={handleMonthChange}
          dailyRevenues={dailyRevenues}
          onDayClick={(date, amount) => {
            if (amount > 0) {
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const dayRevenues = revenues.filter((r) => r.date === dateStr);
              // TODO: show day detail modal
            }
          }}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingRevenue ? "매출 수정" : "매출 등록"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueForm
                key={editingRevenue?.id ?? "new"}
                editingRevenue={editingRevenue}
                onCancel={() => setEditingRevenue(undefined)}
                onSuccess={() => setEditingRevenue(undefined)}
              />
            </CardContent>
          </Card>

          {revenues.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="아직 등록된 매출이 없습니다"
              description="위 양식에서 매출 데이터를 입력하거나, CSV 파일로 한꺼번에 임포트하세요."
              actionLabel="CSV 임포트"
              actionHref="/import"
            />
          ) : (
            <div className="overflow-x-auto">
              <RevenueTable
                data={revenues}
                onEdit={(revenue) => setEditingRevenue(revenue)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
