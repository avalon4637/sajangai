// Phase 1.5 — Weekly ROI mini card
// Shows the user how many minutes/원 the AI 점장 saved this week.
// Purpose: give trial users a concrete reason to convert at D+7.

import type { WeeklyRoiMini } from "@/lib/roi/calculator";

interface WeeklyRoiCardProps {
  roi: WeeklyRoiMini;
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}분`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest > 0 ? `${hours}시간 ${rest}분` : `${hours}시간`;
}

export function WeeklyRoiCard({ roi }: WeeklyRoiCardProps) {
  const isStarting = roi.status === "starting";

  return (
    <div
      className={`rounded-xl p-4 md:p-5 ring-1 ${
        isStarting
          ? "bg-slate-50 ring-slate-200"
          : "bg-gradient-to-br from-emerald-50 to-white ring-emerald-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="text-sm font-bold text-slate-900">
            이번 주 점장이 한 일
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            roi.status === "strong"
              ? "bg-emerald-100 text-emerald-700"
              : roi.status === "moderate"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-200 text-slate-600"
          }`}
        >
          {roi.status === "strong"
            ? "활발함"
            : roi.status === "moderate"
              ? "시작 단계"
              : "데이터 쌓는 중"}
        </span>
      </div>

      {isStarting ? (
        <p className="mt-3 text-xs text-slate-500 leading-relaxed break-keep">
          점장이 아직 본격적으로 일을 시작하지 않았어요. 리뷰 답글이나 일일
          브리핑이 쌓이면 이곳에 절약한 시간이 표시돼요.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-emerald-700">
              {formatMinutes(roi.minutesSaved)}
            </span>
            <span className="text-sm text-emerald-600">아낀 시간</span>
          </div>
          <p className="mt-0.5 text-xs text-emerald-700">
            최저시급 환산 약 {roi.krwSaved.toLocaleString()}원
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            {roi.repliesHandled > 0 && (
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">
                답글 {roi.repliesHandled}건
              </span>
            )}
            {roi.reportsDelivered > 0 && (
              <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">
                브리핑 {roi.reportsDelivered}건
              </span>
            )}
          </div>
        </>
      )}

      <p className="mt-3 text-[10px] text-slate-400">
        ※ 정식 월간 ROI 보고서는 곧 출시돼요
      </p>
    </div>
  );
}
