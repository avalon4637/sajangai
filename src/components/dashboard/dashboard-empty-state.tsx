"use client";

import { BarChart3, TrendingUp, Receipt, Building, Upload } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="size-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">
          아직 입력된 데이터가 없습니다
        </h2>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          대시보드를 확인하려면 먼저 매출, 비용, 고정비 데이터를 입력해주세요.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/revenue">
              <TrendingUp className="size-4" />
              매출 입력
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/expense">
              <Receipt className="size-4" />
              비용 입력
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/fixed-costs">
              <Building className="size-4" />
              고정비 입력
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/import">
              <Upload className="size-4" />
              CSV 임포트
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
