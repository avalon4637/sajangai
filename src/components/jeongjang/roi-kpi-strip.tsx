"use client";

interface RoiKpiStripProps {
  savedMoney: number;
  savedHours: number;
  processedTasks: number;
}

export function RoiKpiStrip({
  savedMoney,
  savedHours,
  processedTasks,
}: RoiKpiStripProps) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-1.5 text-[11px]">
      <span className="text-muted-foreground">이번 달</span>
      <span>💰 <strong className="text-primary">₩{savedMoney.toLocaleString()}</strong> 절약</span>
      <span className="text-muted">·</span>
      <span>⏱️ <strong>{savedHours}</strong>시간 절약</span>
      <span className="text-muted">·</span>
      <span>✅ <strong>{processedTasks}</strong>건 처리</span>
    </div>
  );
}
