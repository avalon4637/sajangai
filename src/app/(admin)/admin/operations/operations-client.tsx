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

interface OperationsClientProps {
  businesses: Business[];
  reports: Report[];
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
    action: "weekly_review",
    label: "주간 리뷰 분석",
    description: "답장이가 최근 리뷰를 분석합니다",
  },
  {
    action: "naver_sync",
    label: "네이버 크롤링",
    description: "네이버 플레이스 리뷰를 동기화합니다",
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function OperationsClient({
  businesses,
  reports: initialReports,
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
            {/* Future trigger placeholder */}
            <button
              disabled
              className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-3 text-left opacity-50"
            >
              <span className="block text-sm font-medium text-zinc-400">
                일일 브리핑
              </span>
              <span className="block text-xs text-zinc-400">
                추후 추가 예정
              </span>
            </button>
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

      {/* Section C: Notification Log Placeholder */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900">
          알림 발송 이력
        </h2>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-400">
            알림 발송 이력 -- 카카오 채널 연동 후 활성화
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            카카오 비즈채널 연동 시 알림톡 발송 내역이 이곳에 표시됩니다.
          </p>
        </div>
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
