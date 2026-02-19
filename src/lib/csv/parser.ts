/**
 * CSV 파싱 및 자동 분류 엔진
 * 카드/배달앱 매출 CSV를 파싱하여 Revenue/Expense 형태로 변환한다.
 */

import Papa from "papaparse";

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
  if (isNaN(amount) || amount === 0) return null;

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

  // 수입/지출 판단
  const isExpense =
    parseInt(row[amountKey].replace(/[,원\s]/g, ""), 10) < 0 ||
    findKey(row, ["매입", "지출"]) !== null;

  return {
    date: normalizeDate(row[dateKey]),
    channel,
    category,
    amount,
    type: isExpense ? "expense" : "revenue",
    memo: row["메모"] || row["memo"] || row["비고"] || "",
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

function normalizeDate(raw: string): string {
  // 다양한 날짜 형식 정규화 → YYYY-MM-DD
  const cleaned = raw.replace(/[./년월일]/g, "-").replace(/-+$/, "");
  const parts = cleaned.split("-").filter(Boolean);

  if (parts.length === 3) {
    const year =
      parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return raw;
}
