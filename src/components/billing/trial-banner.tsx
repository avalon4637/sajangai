"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  daysLeft: number;
  isExpired: boolean;
}

export function TrialBanner({ daysLeft, isExpired }: TrialBannerProps) {
  if (!isExpired && daysLeft > 3) return null;

  return (
    <div
      className={`rounded-lg p-4 text-sm ${
        isExpired
          ? "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800"
          : "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          {isExpired ? (
            <>
              <p className="font-semibold text-red-800 dark:text-red-400">
                체험 기간이 종료되었어요
              </p>
              <p className="text-red-700 dark:text-red-500 text-xs mt-1">
                데이터 수집이 중단되었어요. 점장을 고용하면 매일 분석을 받을 수 있어요.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-800 dark:text-amber-400">
                체험 {daysLeft}일 남았어요
              </p>
              <p className="text-amber-700 dark:text-amber-500 text-xs mt-1">
                하루 990원으로 AI 점장을 계속 고용하세요
              </p>
            </>
          )}
        </div>
        <Button asChild size="sm" variant={isExpired ? "default" : "outline"}>
          <Link href="/billing">점장 고용하기</Link>
        </Button>
      </div>
    </div>
  );
}
