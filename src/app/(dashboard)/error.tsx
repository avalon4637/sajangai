"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold">페이지를 불러오지 못했어요</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "데이터를 가져오는 중 문제가 발생했습니다."}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
            대시보드로
          </Button>
        </div>
      </div>
    </div>
  );
}
