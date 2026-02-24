"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/data-entry/month-picker";
import { RevenueForm } from "@/components/data-entry/revenue-form";
import { RevenueTable } from "@/components/data-entry/revenue-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { Revenue } from "@/types/data-entry";

interface RevenuePageClientProps {
  revenues: Revenue[];
}

export function RevenuePageClient({ revenues }: RevenuePageClientProps) {
  const [editingRevenue, setEditingRevenue] = useState<Revenue | undefined>(
    undefined
  );

  const totalAmount = revenues.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <MonthPicker basePath="/dashboard/revenue" />
        <div className="text-lg font-semibold">
          월 매출 합계:{" "}
          <span className="text-primary">
            {totalAmount.toLocaleString("ko-KR")}원
          </span>
        </div>
      </div>

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
    </div>
  );
}
