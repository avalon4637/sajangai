"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-xl font-semibold">문제가 발생했어요</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "예상치 못한 오류가 발생했습니다. 다시 시도해주세요."}
        </p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
