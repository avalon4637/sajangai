"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";

const DISMISS_KEY = "demo-data-banner-dismissed";

interface DemoDataBannerProps {
  hasActiveConnections: boolean;
}

/**
 * Subtle banner shown when the business has no real data connections.
 * Dismissible with localStorage persistence.
 */
export function DemoDataBanner({ hasActiveConnections }: DemoDataBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY);
    setDismissed(stored === "true");
  }, []);

  if (hasActiveConnections || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
      <div className="flex items-center gap-2">
        <Info className="size-4 shrink-0" />
        <span>
          데모 데이터로 체험 중입니다{" "}
          <span className="mx-1 text-blue-400">·</span>{" "}
          <Link
            href="/settings/connections"
            className="font-medium underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-200"
          >
            실제 데이터 연동하기
          </Link>
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        aria-label="배너 닫기"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
