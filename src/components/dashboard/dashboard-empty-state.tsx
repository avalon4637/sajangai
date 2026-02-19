"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Receipt, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">
          아직 입력된 데이터가 없습니다
        </h2>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          대시보드를 확인하려면 먼저 매출, 비용, 고정비 데이터를 입력해주세요.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/revenue"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-sm font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            매출 입력
          </Link>
          <Link
            href="/expense"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-sm font-medium"
          >
            <Receipt className="h-4 w-4" />
            비용 입력
          </Link>
          <Link
            href="/fixed-costs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-sm font-medium"
          >
            <Building className="h-4 w-4" />
            고정비 입력
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
