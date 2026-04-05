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
    <div className="flex items-center gap-4 border-b px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">💰</span>
        <div>
          <p className="text-[10px] text-muted-foreground">절약 금액</p>
          <p className="text-sm font-bold text-[#4B6BF5]">
            ₩{savedMoney.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="h-7 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-sm">⏱️</span>
        <div>
          <p className="text-[10px] text-muted-foreground">절약 시간</p>
          <p className="text-sm font-bold">{savedHours}시간</p>
        </div>
      </div>
      <div className="h-7 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-sm">✅</span>
        <div>
          <p className="text-[10px] text-muted-foreground">처리 업무</p>
          <p className="text-sm font-bold">{processedTasks}건</p>
        </div>
      </div>
      <div className="flex-1" />
      <p className="text-[10px] text-muted-foreground">이번 달</p>
    </div>
  );
}
