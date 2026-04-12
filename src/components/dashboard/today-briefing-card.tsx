// Today Briefing Card - Phase 1.2
// Renders the latest jeongjang_briefing for TODAY on the dashboard main view.
// Empty state encourages cron auto-generation (08:00 KST) or admin manual trigger.

import Link from "next/link";

interface BriefingStructured {
  oneLiner?: string;
  revenue?: number;
  reviewCount?: number;
  negativeReviewCount?: number;
  alert?: string;
  todayAction?: string;
}

interface BriefingContent {
  narrative?: string;
  structured?: BriefingStructured;
  generatedAt?: string;
}

interface TodayBriefingCardProps {
  briefing: {
    id: string;
    reportDate: string;
    summary: string | null;
    content: Record<string, unknown> | null;
  } | null;
  businessName: string;
}

function formatRevenue(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`;
  if (amount >= 10000) return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  return `${amount.toLocaleString()}원`;
}

function formatTodayLabel(): string {
  const now = new Date();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][now.getDay()];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 (${weekday})`;
}

export function TodayBriefingCard({
  briefing,
  businessName,
}: TodayBriefingCardProps) {
  const todayLabel = formatTodayLabel();

  // ─── Empty state: briefing not yet generated ─────────────────────────────
  if (!briefing) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl">
            👨‍💼
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-indigo-900">
                오늘의 브리핑
              </h3>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                {todayLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-indigo-800 leading-relaxed break-keep">
              아직 오늘의 브리핑이 준비되지 않았어요. 매일 아침 08:00에 점장이
              {businessName ? ` ${businessName}` : ""}의 매출·리뷰·비용을 분석해서
              올려드려요.
            </p>
            <p className="mt-1 text-xs text-indigo-600">
              ※ 관리자는{" "}
              <Link
                href="/admin/operations"
                className="font-semibold underline"
              >
                /admin/operations
              </Link>
              에서 수동 생성 가능해요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Present state: today's briefing exists ──────────────────────────────
  const content = briefing.content as BriefingContent | null;
  const structured = content?.structured;
  const narrative =
    content?.narrative ?? briefing.summary ?? "브리핑 내용 준비 중이에요.";

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 shadow-sm md:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xl text-white shadow-sm">
            👨‍💼
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">
              오늘의 브리핑
            </h3>
            <p className="text-[11px] text-indigo-600">
              점장 · {todayLabel}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          ● 오늘 준비됨
        </span>
      </div>

      {/* One-liner (hero) */}
      {structured?.oneLiner && (
        <p className="mt-3 text-base font-semibold text-slate-900 leading-snug break-keep">
          {structured.oneLiner}
        </p>
      )}

      {/* Narrative */}
      <p className="mt-2 text-sm text-slate-700 leading-relaxed break-keep whitespace-pre-line">
        {narrative.length > 220 ? narrative.slice(0, 220) + "..." : narrative}
      </p>

      {/* Quick stats */}
      {structured && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {structured.revenue !== undefined && structured.revenue > 0 && (
            <StatPill
              label="어제 매출"
              value={formatRevenue(structured.revenue)}
              tone="blue"
            />
          )}
          {structured.reviewCount !== undefined &&
            structured.reviewCount > 0 && (
              <StatPill
                label="새 리뷰"
                value={`${structured.reviewCount}건`}
                tone="slate"
              />
            )}
          {structured.negativeReviewCount !== undefined &&
            structured.negativeReviewCount > 0 && (
              <StatPill
                label="부정 리뷰"
                value={`${structured.negativeReviewCount}건`}
                tone="rose"
              />
            )}
        </div>
      )}

      {/* Action */}
      {structured?.todayAction && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 ring-1 ring-amber-200">
          <span className="text-sm">💡</span>
          <p className="text-xs font-medium text-amber-900 leading-relaxed break-keep">
            {structured.todayAction}
          </p>
        </div>
      )}

      {/* Alert */}
      {structured?.alert && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-rose-50 p-2.5 ring-1 ring-rose-200">
          <span className="text-sm">⚠️</span>
          <p className="text-xs font-medium text-rose-900 leading-relaxed break-keep">
            {structured.alert}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────

const STAT_TONE: Record<"blue" | "slate" | "rose", string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
};

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "slate" | "rose";
}) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ring-1 ${STAT_TONE[tone]}`}>
      <p className="text-[10px] font-medium opacity-70">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
