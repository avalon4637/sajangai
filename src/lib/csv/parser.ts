/**
 * CSV 파싱 및 자동 분류 엔진
 * 카드/배달앱 매출 CSV를 파싱하여 Revenue/Expense 형태로 변환한다.
 */

import Papa from "papaparse";

const MAX_AMOUNT = 10_000_000_000;

const sanitize = (s: string) => s.replace(/[<>"'&]/g, "").trim().slice(0, 200);

export interface ParsedRow {
  date: string;
  channel: string;
  category: string;
  amount: number;
  type: "revenue" | "expense";
  memo: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
  totalRows: number;
}

export function parseCsv(csvContent: string): ParseResult {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (const row of result.data as Record<string, string>[]) {
    try {
      const parsed = normalizeRow(row);
      if (parsed) rows.push(parsed);
    } catch (e) {
      errors.push(`행 파싱 실패: ${JSON.stringify(row)} - ${e}`);
    }
  }

  return {
    rows,
    errors,
    totalRows: result.data.length,
  };
}

function normalizeRow(row: Record<string, string>): ParsedRow | null {
  // 날짜 필드 탐색
  const dateKey = findKey(row, ["날짜", "date", "거래일", "거래일자", "일자"]);
  // 금액 필드 탐색
  const amountKey = findKey(row, [
    "금액",
    "amount",
    "매출",
    "매입",
    "결제금액",
    "승인금액",
  ]);

  if (!dateKey || !amountKey) return null;

  const rawAmount = row[amountKey].replace(/[,원\s]/g, "");
  const amount = Math.abs(parseInt(rawAmount, 10));
  if (isNaN(amount) || amount === 0 || amount > MAX_AMOUNT) return null;

  // 채널 추론
  const channelKey = findKey(row, ["채널", "channel", "결제수단", "가맹점"]);
  const channel = channelKey ? classifyChannel(row[channelKey]) : "기타";

  // 카테고리 추론
  const categoryKey = findKey(row, [
    "카테고리",
    "category",
    "분류",
    "항목",
    "적요",
  ]);
  const category = categoryKey ? row[categoryKey] : "미분류";

  // Date validation
  const date = normalizeDate(row[dateKey]);
  if (!date) return null;

  // 수입/지출 판단
  const isExpense =
    parseInt(row[amountKey].replace(/[,원\s]/g, ""), 10) < 0 ||
    findKey(row, ["매입", "지출"]) !== null;

  return {
    date,
    channel: sanitize(channel),
    category: sanitize(category),
    amount,
    type: isExpense ? "expense" : "revenue",
    memo: sanitize(row["메모"] || row["memo"] || row["비고"] || ""),
  };
}

function findKey(
  row: Record<string, string>,
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    const key = Object.keys(row).find(
      (k) => k.includes(candidate) || candidate.includes(k)
    );
    if (key && row[key]) return key;
  }
  return null;
}

function classifyChannel(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("카드") || v.includes("card")) return "카드";
  if (v.includes("현금") || v.includes("cash")) return "현금";
  if (
    v.includes("배달") ||
    v.includes("배민") ||
    v.includes("요기요") ||
    v.includes("쿠팡이츠")
  )
    return "배달앱";
  if (v.includes("온라인") || v.includes("네이버") || v.includes("쿠팡"))
    return "온라인";
  return "기타";
}

function normalizeDate(raw: string): string | null {
  // Normalize various date formats to YYYY-MM-DD
  const cleaned = raw.replace(/[./년월일]/g, "-").replace(/-+$/, "");
  const parts = cleaned.split("-").filter(Boolean);

  if (parts.length === 3) {
    const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return null;

    return dateStr;
  }

  return null;
}
