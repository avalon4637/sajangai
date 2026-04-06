"use client";

// Unified transaction list client component for SPEC-FINANCE-002 M2
// Filter chips, search, date-grouped list, monthly summary

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  UnifiedTransaction,
  MonthlyTotals,
} from "@/lib/queries/transaction-unified";

// Day-of-week labels in Korean
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// Filter chip definitions
const FILTER_CHIPS = [
  { key: "all", label: "전체" },
  { key: "revenue", label: "매출" },
  { key: "expense", label: "매입" },
  { key: "고정비용", label: "고정비" },
  { key: "인건비", label: "인건비" },
  { key: "식자재", label: "식자재" },
  { key: "수수료", label: "수수료" },
];

interface TransactionsPageClientProps {
  transactions: UnifiedTransaction[];
  totals: MonthlyTotals;
  yearMonth: string;
  initialFilter: string;
}

/**
 * Format a date string to "MM/DD (요일)" format.
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dayOfWeek = DAY_LABELS[date.getDay()];
  return `${month}/${day} (${dayOfWeek})`;
}

/**
 * Format year-month for display: "2026년 4월"
 */
function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month)}월`;
}

/**
 * Group transactions by date.
 */
function groupByDate(
  transactions: UnifiedTransaction[]
): Map<string, UnifiedTransaction[]> {
  const groups = new Map<string, UnifiedTransaction[]>();
  for (const tx of transactions) {
    const existing = groups.get(tx.date);
    if (existing) {
      existing.push(tx);
    } else {
      groups.set(tx.date, [tx]);
    }
  }
  return groups;
}

export function TransactionsPageClient({
  transactions,
  totals,
  yearMonth,
  initialFilter,
}: TransactionsPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  // Navigate to previous/next month
  const navigateMonth = useCallback(
    (direction: -1 | 1) => {
      const [y, m] = yearMonth.split("-").map(Number);
      const date = new Date(y, m - 1 + direction, 1);
      const newYm = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      router.push(`/transactions?ym=${newYm}${activeFilter !== "all" ? `&type=${activeFilter}` : ""}`);
    },
    [yearMonth, activeFilter, router]
  );

  // Apply filter chip
  const handleFilterChange = useCallback(
    (key: string) => {
      setActiveFilter(key);
      router.push(`/transactions?ym=${yearMonth}${key !== "all" ? `&type=${key}` : ""}`);
    },
    [yearMonth, router]
  );

  // Client-side search filter
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        (t.content?.toLowerCase().includes(q)) ||
        (t.vendor?.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  // Group by date
  const dateGroups = useMemo(
    () => groupByDate(filteredTransactions),
    [filteredTransactions]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">거래 내역</h1>
        <div className="flex items-center gap-2">
          {/* Month navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {formatYearMonth(yearMonth)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => router.push("/transactions/upload")}
      >
        <Upload className="h-3.5 w-3.5" />
        매입 업로드
      </Button>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => handleFilterChange(chip.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              activeFilter === chip.key
                ? "bg-[#18181B] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="거래처, 내용 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "검색 결과가 없습니다" : "이번 달 거래 내역이 없습니다"}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.push("/transactions/upload")}
              >
                매입 데이터 업로드
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {Array.from(dateGroups.entries()).map(([date, txs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="sticky top-0 bg-gray-50/80 backdrop-blur-sm px-1 py-1.5 text-xs font-medium text-muted-foreground">
                {formatDateLabel(date)}
              </div>

              {/* Transactions for this date */}
              <div className="space-y-0.5">
                {txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
                        tx.type === "revenue"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {tx.type === "revenue" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.content || tx.category}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.category}
                        {tx.vendor ? ` \u00B7 ${tx.vendor}` : ""}
                        {tx.channel ? ` \u00B7 ${tx.channel}` : ""}
                      </p>
                    </div>

                    {/* Amount */}
                    <span
                      className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                        tx.type === "revenue"
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }`}
                    >
                      {tx.type === "revenue" ? "+" : "-"}
                      {tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly summary */}
      <Card className="bg-gray-50">
        <CardContent className="py-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            이번 달 합계
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">매출 </span>
              <span className="font-semibold text-emerald-600">
                +{(totals.totalRevenue / 10000).toFixed(0)}만
              </span>
            </div>
            <span className="text-muted-foreground">|</span>
            <div>
              <span className="text-muted-foreground">매입 </span>
              <span className="font-semibold text-orange-600">
                -{(totals.totalExpense / 10000).toFixed(0)}만
              </span>
            </div>
            <span className="text-muted-foreground">|</span>
            <div>
              <span className="text-muted-foreground">순이익 </span>
              <span
                className={`font-semibold ${
                  totals.netProfit >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {totals.netProfit >= 0 ? "+" : ""}
                {(totals.netProfit / 10000).toFixed(0)}만
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
