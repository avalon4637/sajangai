"use client";

import { useState, useTransition } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Business {
  id: string;
  name: string;
  naverPlaceId: string | null;
  naverLastSyncedAt: string | null;
}

interface Report {
  id: string;
  business_id: string;
  report_date: string | null;
  report_type: string;
  summary: string | null;
  created_at: string;
  businessName: string;
}

export interface AiCallStats {
  total: number;
  successRate: number; // percentage, 0~100
  avgLatencyMs: number;
  totalCostKrw: number;
  byModel: Record<string, number>;
  byFunction: Record<string, number>;
}

export interface HyphenStatus {
  configured: boolean;
  testMode: boolean;
  activeConnectionCount: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncType: string | null;
}

export interface NotificationLogEntry {
  id: string;
  businessId: string;
  businessName: string;
  summary: string;
  createdAt: string;
  templateId: string;
  channel: string;
  success: boolean;
  error: string | null;
}

interface OperationsClientProps {
  businesses: Business[];
  reports: Report[];
  aiStats: AiCallStats;
  hyphenStatus: HyphenStatus;
  notificationLogs: NotificationLogEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REPORT_TYPE_LABELS: Record<string, string> = {
  jeongjang_briefing: "일일 브리핑",
  dapjangi_review: "리뷰 분석",
  seri_profit: "손익 분석",
  review_weekly: "주간 리뷰",
  seri_cashflow: "현금흐름",
  seri_survival: "생존 게이지",
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  jeongjang_briefing: "bg-indigo-100 text-indigo-700",
  dapjangi_review: "bg-amber-100 text-amber-700",
  seri_profit: "bg-emerald-100 text-emerald-700",
  review_weekly: "bg-purple-100 text-purple-700",
  seri_cashflow: "bg-cyan-100 text-cyan-700",
  seri_survival: "bg-rose-100 text-rose-700",
};

const OPERATIONS = [
  {
    action: "generate_briefing",
    label: "일일 브리핑",
    description: "점장 아침 루틴을 즉시 실행합니다",
  },
  {
    action: "cross_diagnosis",
    label: "크로스 진단",
    description: "매출·리뷰 교차 분석으로 원인을 추정합니다",
  },
  {
    action: "generate_monthly_roi",
    label: "월간 ROI 생성",
    description: "지난 달 점장 성과표를 계산하고 저장합니다",
  },
  {
    action: "weekly_review",
    label: "주간 리뷰 분석",
    description: "답장이가 최근 리뷰를 분석합니다",
  },
  {
    action: "naver_sync",
    label: "네이버 크롤링",
    description: "네이버 플레이스 리뷰를 동기화합니다",
  },
  {
    action: "hyphen_sync",
    label: "하이픈 동기화",
    description: "배달앱·카드 매출/리뷰를 일괄 수집합니다",
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function OperationsClient({
  businesses,
  reports: initialReports,
  aiStats,
  hyphenStatus,
  notificationLogs,
}: OperationsClientProps) {
  const [selectedBizId, setSelectedBizId] = useState(
    businesses[0]?.id ?? ""
  );
  const [reports] = useState(initialReports);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleTrigger(action: string) {
    if (!selectedBizId) {
      showToast("사업장을 선택해주세요.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, businessId: selectedBizId }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.message ?? "완료되었습니다.", "success");
        } else {
          showToast(
            data.message ?? data.error ?? "작업에 실패했습니다.",
            "error"
          );
        }
      } catch {
        showToast("네트워크 오류가 발생했습니다.", "error");
      }
    });
  }

  const selectedBiz = businesses.find((b) => b.id === selectedBizId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Section E: Hyphen Integration Status (Phase 1.1) */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          하이픈 연동 상태
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <HyphenStatusCard
            label="API 키"
            value={hyphenStatus.configured ? "설정됨" : "누락"}
            tone={hyphenStatus.configured ? "emerald" : "rose"}
          />
          <HyphenStatusCard
            label="모드"
            value={hyphenStatus.testMode ? "TEST" : "PROD"}
            tone={hyphenStatus.testMode ? "amber" : "emerald"}
          />
          <HyphenStatusCard
            label="활성 연결"
            value={`${hyphenStatus.activeConnectionCount}개`}
            tone={hyphenStatus.activeConnectionCount > 0 ? "emerald" : "rose"}
          />
          <HyphenStatusCard
            label="마지막 동기화"
            value={
              hyphenStatus.lastSyncAt
                ? new Date(hyphenStatus.lastSyncAt).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "없음"
            }
            tone={
              hyphenStatus.lastSyncStatus === "completed"
                ? "emerald"
                : hyphenStatus.lastSyncStatus === "failed"
                  ? "rose"
                  : "indigo"
            }
          />
        </div>
        {!hyphenStatus.configured && (
          <p className="mt-2 text-xs text-rose-600">
            ⚠ HYPHEN_USER_ID / HYPHEN_HKEY 환경변수를 설정해야 실제
            동기화가 가능합니다.
          </p>
        )}
        {hyphenStatus.testMode && hyphenStatus.configured && (
          <p className="mt-2 text-xs text-amber-700">
            ⚠ 현재 TEST 모드입니다. 프로덕션 데이터를 수집하려면
            HYPHEN_TEST_MODE=false로 변경하세요.
          </p>
        )}
      </section>

      {/* Section A: Manual Triggers */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          수동 실행
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          {/* Business selector */}
          <div className="mb-4">
            <label
              htmlFor="business-select"
              className="mb-1 block text-sm font-medium text-zinc-600"
            >
              사업장 선택
            </label>
            <select
              id="business-select"
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              className="w-full max-w-md rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
            >
              {businesses.length === 0 && (
                <option value="">등록된 사업장 없음</option>
              )}
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {selectedBiz?.naverPlaceId && (
              <p className="mt-1 text-xs text-zinc-400">
                네이버 플레이스: {selectedBiz.naverPlaceId}
                {selectedBiz.naverLastSyncedAt && (
                  <>
                    {" "}
                    | 마지막 동기화:{" "}
                    {new Date(
                      selectedBiz.naverLastSyncedAt
                    ).toLocaleString("ko-KR")}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Operation buttons */}
          <div className="flex flex-wrap gap-3">
            {OPERATIONS.map((op) => (
              <button
                key={op.action}
                onClick={() => handleTrigger(op.action)}
                disabled={isPending || !selectedBizId}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-sm font-medium text-zinc-900">
                  {op.label}
                </span>
                <span className="block text-xs text-zinc-500">
                  {op.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section B: Recent Reports Log */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          최근 리포트 ({reports.length}건)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">시간</th>
                <th className="px-4 py-3 font-medium">사업장</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">요약</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reports.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() =>
                    setExpandedId(expandedId === r.id ? null : r.id)
                  }
                  className={`cursor-pointer transition hover:bg-zinc-50 ${
                    i % 2 === 1 ? "bg-zinc-50/50" : ""
                  } ${expandedId === r.id ? "bg-indigo-50" : ""}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                    {new Date(r.created_at).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.businessName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        REPORT_TYPE_COLORS[r.report_type] ??
                        "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-600">
                    {r.summary
                      ? r.summary.length > 80
                        ? r.summary.slice(0, 80) + "..."
                        : r.summary
                      : "-"}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    최근 30일간 생성된 리포트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Expanded detail */}
          {expandedId && (
            <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-4">
              <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                리포트 상세
              </h4>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs text-zinc-600 border border-zinc-200">
                {reports.find((r) => r.id === expandedId)?.summary ??
                  "내용 없음"}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* Section C: Notification Log (Phase 1.3) */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-zinc-900">알림 발송 이력</h2>
          <span className="text-xs text-zinc-500">최근 7일</span>
        </div>
        {notificationLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <p className="text-sm text-zinc-400">
              최근 7일 동안 발송된 알림이 없습니다.
            </p>
            <p className="mt-1 text-xs text-zinc-300">
              cron이 실행되면 여기 쌓입니다. (/api/cron/daily-briefing 08:00 KST)
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">시간</th>
                  <th className="px-4 py-3 font-medium">사업장</th>
                  <th className="px-4 py-3 font-medium">템플릿</th>
                  <th className="px-4 py-3 font-medium">채널</th>
                  <th className="px-4 py-3 font-medium">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {notificationLogs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={i % 2 === 1 ? "bg-zinc-50/50" : ""}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(log.createdAt).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.businessName}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {log.templateId || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.channel === "alimtalk"
                            ? "bg-amber-100 text-amber-700"
                            : log.channel === "sms"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {log.channel || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="text-xs font-semibold text-emerald-700">
                          ✓ 성공
                        </span>
                      ) : (
                        <span
                          className="text-xs font-semibold text-rose-700"
                          title={log.error ?? undefined}
                        >
                          ✗ 실패
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section D: AI Call Stats (Phase 0.6) */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-zinc-900">
            AI 호출 통계
          </h2>
          <span className="text-xs text-zinc-500">최근 24시간</span>
        </div>

        {aiStats.total === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
            <p className="text-sm text-zinc-400">
              최근 24시간 동안 집계된 AI 호출이 없습니다.
            </p>
            <p className="mt-1 text-xs text-zinc-300">
              ai_call_logs 테이블에 데이터가 쌓이면 자동으로 표시됩니다.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <AiStatCard
                label="총 호출"
                value={aiStats.total.toLocaleString()}
                unit="건"
                tone="indigo"
              />
              <AiStatCard
                label="성공률"
                value={aiStats.successRate.toFixed(1)}
                unit="%"
                tone={aiStats.successRate >= 99 ? "emerald" : aiStats.successRate >= 95 ? "amber" : "rose"}
              />
              <AiStatCard
                label="평균 지연"
                value={aiStats.avgLatencyMs.toLocaleString()}
                unit="ms"
                tone={aiStats.avgLatencyMs < 3000 ? "emerald" : aiStats.avgLatencyMs < 8000 ? "amber" : "rose"}
              />
              <AiStatCard
                label="추정 비용"
                value={`₩${aiStats.totalCostKrw.toLocaleString()}`}
                unit=""
                tone="cyan"
              />
            </div>

            {/* Breakdown tables */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <AiBreakdownCard title="모델별" entries={aiStats.byModel} />
              <AiBreakdownCard title="함수별" entries={aiStats.byFunction} />
            </div>
          </>
        )}
      </section>

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="flex items-center gap-3 rounded-lg bg-white px-6 py-4 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            <span className="text-sm">처리 중...</span>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── AI stats sub-components (Phase 0.6) ─────────────────────────────────────

type StatTone = "indigo" | "emerald" | "amber" | "rose" | "cyan";

const TONE_CLASSES: Record<StatTone, string> = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

function AiStatCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: StatTone;
}) {
  return (
    <div className={`rounded-lg p-4 ring-1 ${TONE_CLASSES[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">
        {value}
        {unit && <span className="ml-0.5 text-sm font-semibold">{unit}</span>}
      </p>
    </div>
  );
}

function HyphenStatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatTone;
}) {
  return (
    <div className={`rounded-lg p-3 ring-1 ${TONE_CLASSES[tone]}`}>
      <p className="text-[11px] font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold tracking-tight">{value}</p>
    </div>
  );
}

function AiBreakdownCard({
  title,
  entries,
}: {
  title: string;
  entries: Record<string, number>;
}) {
  const sorted = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500">
        {title}
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-400">데이터 없음</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map(([name, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li
                key={name}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate font-medium text-zinc-700">
                  {name}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {count.toLocaleString()} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
