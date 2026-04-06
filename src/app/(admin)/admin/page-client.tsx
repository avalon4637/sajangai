"use client";

import { useState, useTransition } from "react";
import {
  getAdminDashboardData,
  updateSubscriptionStatus,
  deactivateBusiness,
  reactivateBusiness,
  deleteBusiness,
} from "@/lib/actions/admin";

type DashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
type RowData = DashboardData["rows"][number];

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  past_due: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-zinc-100 text-zinc-500",
  none: "bg-zinc-100 text-zinc-400",
};

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "trial", label: "체험" },
  { value: "active", label: "유료" },
  { value: "past_due", label: "연체" },
  { value: "cancelled", label: "해지" },
  { value: "expired", label: "만료" },
];

const SUBSCRIPTION_STATUSES = ["trial", "active", "past_due", "cancelled", "expired"];

export function AdminDashboardClient({
  initialData,
}: {
  initialData: DashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh(f?: string, s?: string) {
    startTransition(async () => {
      const result = await getAdminDashboardData(f ?? filter, s ?? search);
      setData(result);
    });
  }

  function handleFilterChange(f: string) {
    setFilter(f);
    refresh(f, search);
  }

  function handleSearch(s: string) {
    setSearch(s);
    refresh(filter, s);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="총 가입자" value={data.kpi.totalUsers} suffix="명" />
        <KPICard
          label="유료 전환"
          value={data.kpi.activePaid}
          suffix="명"
          sub={
            data.kpi.totalUsers > 0
              ? `전환율 ${Math.round((data.kpi.activePaid / data.kpi.totalUsers) * 100)}%`
              : undefined
          }
        />
        <KPICard
          label="MRR"
          value={data.kpi.mrr.toLocaleString()}
          suffix="원"
        />
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="사업장명 검색..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">사업장</th>
              <th className="px-4 py-3 font-medium">업종</th>
              <th className="px-4 py-3 font-medium">가입일</th>
              <th className="px-4 py-3 font-medium">구독</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.rows.map((row) => (
              <tr
                key={row.businessId}
                onClick={() => setSelectedRow(row)}
                className={`cursor-pointer transition hover:bg-zinc-50 ${
                  !row.isActive ? "opacity-50" : ""
                } ${selectedRow?.businessId === row.businessId ? "bg-indigo-50" : ""}`}
              >
                <td className="px-4 py-3 font-medium">
                  {row.businessName}
                  {!row.isActive && (
                    <span className="ml-2 text-xs text-red-500">비활성</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {row.businessType ?? "-"}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(row.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[row.subscriptionStatus] ?? STATUS_COLORS.none
                    }`}
                  >
                    {row.subscriptionStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.isActive ? (
                    <span className="text-green-600">활성</span>
                  ) : (
                    <span className="text-red-500">비활성</span>
                  )}
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedRow && (
        <DetailPanel
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onRefresh={() => {
            setSelectedRow(null);
            refresh();
          }}
        />
      )}

      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
            처리 중...
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  suffix,
  sub,
}: {
  label: string;
  value: string | number;
  suffix: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        <span className="ml-1 text-base font-normal text-zinc-400">
          {suffix}
        </span>
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function DetailPanel({
  row,
  onClose,
  onRefresh,
}: {
  row: RowData;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [newStatus, setNewStatus] = useState(row.subscriptionStatus);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleUpdateSubscription() {
    if (newStatus === row.subscriptionStatus) return;
    startTransition(async () => {
      const result = await updateSubscriptionStatus(row.businessId, newStatus);
      if (result.error) {
        setMessage(`오류: ${result.error}`);
      } else {
        setMessage("구독 상태가 변경되었습니다.");
        setTimeout(onRefresh, 1000);
      }
    });
  }

  function handleDeactivate() {
    if (!confirm(`"${row.businessName}" 사업장을 비활성화하시겠습니까?\n비활성화 후 30일 이후 삭제 가능합니다.`)) return;
    startTransition(async () => {
      const result = await deactivateBusiness(row.businessId);
      if (result.error) {
        setMessage(`오류: ${result.error}`);
      } else {
        setMessage("사업장이 비활성화되었습니다.");
        setTimeout(onRefresh, 1000);
      }
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      const result = await reactivateBusiness(row.businessId);
      if (result.error) {
        setMessage(`오류: ${result.error}`);
      } else {
        setMessage("사업장이 복구되었습니다.");
        setTimeout(onRefresh, 1000);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`"${row.businessName}" 사업장을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    startTransition(async () => {
      const result = await deleteBusiness(row.businessId);
      if (result.error) {
        setMessage(`오류: ${result.error}`);
      } else {
        setMessage("사업장이 삭제되었습니다.");
        setTimeout(onRefresh, 1000);
      }
    });
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 max-w-[95vw] border-l border-zinc-200 bg-white p-6 shadow-xl overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{row.businessName}</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          ✕
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <InfoRow label="업종" value={row.businessType ?? "-"} />
        <InfoRow
          label="가입일"
          value={new Date(row.createdAt).toLocaleDateString("ko-KR")}
        />
        <InfoRow label="상태" value={row.isActive ? "활성" : "비활성"} />
        <InfoRow label="역할" value={row.role} />
      </div>

      {/* Subscription Management */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-zinc-700">구독 관리</h4>
        <div className="mt-2 flex items-center gap-2">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          >
            {SUBSCRIPTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleUpdateSubscription}
            disabled={isPending || newStatus === row.subscriptionStatus}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            변경
          </button>
        </div>
      </div>

      {/* Business Management */}
      <div className="mt-6 border-t pt-4">
        <h4 className="text-sm font-semibold text-zinc-700">사업장 관리</h4>
        <div className="mt-3 flex flex-col gap-2">
          {row.isActive ? (
            <button
              onClick={handleDeactivate}
              disabled={isPending}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              사업장 비활성화
            </button>
          ) : (
            <>
              <button
                onClick={handleReactivate}
                disabled={isPending}
                className="rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
              >
                사업장 복구
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                영구 삭제 (비활성 30일 후)
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm ${
            message.startsWith("오류")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
