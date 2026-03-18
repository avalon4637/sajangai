// Card statement CSV parser for SPEC-SERI-002
// Supports major Korean card companies: 신한카드, 국민카드, 삼성카드, 현대카드, etc.

import type { ParsedTransaction } from "@/types/bookkeeping";

export interface CardParseResult {
  cardCompany: string;
  transactions: ParsedTransaction[];
  errors: string[];
  totalRows: number;
}

type CardFormat = {
  name: string;
  keywords: string[];
  dateKey: string[];
  amountKey: string[];
  merchantKey: string[];
  installmentKey: string[];
};

const CARD_FORMATS: CardFormat[] = [
  {
    name: "신한카드",
    keywords: ["신한카드", "shinhan card"],
    dateKey: ["이용일", "거래일", "승인일", "날짜"],
    amountKey: ["이용금액", "승인금액", "금액"],
    merchantKey: ["가맹점", "이용가맹점", "가맹점명", "상호"],
    installmentKey: ["할부", "할부개월"],
  },
  {
    name: "국민카드",
    keywords: ["국민카드", "kb카드", "kb card"],
    dateKey: ["이용일", "거래일", "날짜"],
    amountKey: ["이용금액", "금액", "승인금액"],
    merchantKey: ["가맹점명", "가맹점", "이용가맹점"],
    installmentKey: ["할부기간", "할부"],
  },
  {
    name: "삼성카드",
    keywords: ["삼성카드", "samsung card"],
    dateKey: ["이용일자", "이용일", "거래일"],
    amountKey: ["이용금액", "금액"],
    merchantKey: ["이용가맹점", "가맹점명", "가맹점"],
    installmentKey: ["할부", "개월"],
  },
  {
    name: "현대카드",
    keywords: ["현대카드", "hyundai card"],
    dateKey: ["이용일", "거래일"],
    amountKey: ["이용금액", "금액", "결제금액"],
    merchantKey: ["가맹점명", "이용가맹점", "가맹점"],
    installmentKey: ["할부개월", "할부"],
  },
  {
    name: "롯데카드",
    keywords: ["롯데카드", "lotte card"],
    dateKey: ["이용일", "거래일", "이용일자"],
    amountKey: ["이용금액", "금액"],
    merchantKey: ["가맹점명", "이용가맹점"],
    installmentKey: ["할부"],
  },
  {
    name: "하나카드",
    keywords: ["하나카드", "hana card"],
    dateKey: ["이용일", "거래일"],
    amountKey: ["이용금액", "금액"],
    merchantKey: ["가맹점명", "이용가맹점"],
    installmentKey: ["할부"],
  },
  {
    name: "우리카드",
    keywords: ["우리카드", "woori card"],
    dateKey: ["이용일", "거래일"],
    amountKey: ["이용금액", "금액"],
    merchantKey: ["가맹점명", "이용가맹점"],
    installmentKey: ["할부"],
  },
];

/**
 * Detect card company format from CSV header lines.
 */
export function detectCardFormat(headerLines: string[]): CardFormat | null {
  const combined = headerLines.slice(0, 5).join(" ").toLowerCase();
  return CARD_FORMATS.find((fmt) =>
    fmt.keywords.some((kw) => combined.includes(kw.toLowerCase()))
  ) ?? null;
}

/**
 * Parse a card statement CSV string into ParsedTransaction[].
 */
export function parseCardStatement(csvContent: string): CardParseResult {
  const lines = csvContent.split(/\r?\n/);
  const errors: string[] = [];

  const cardFormat = detectCardFormat(lines);
  const cardCompany = cardFormat?.name ?? "알 수 없는 카드사";

  // Find header row
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const cols = splitCsvLine(lines[i]);
    const colsLower = cols.map((c) => c.toLowerCase().trim());
    const hasDate = colsLower.some(
      (c) =>
        c.includes("이용일") ||
        c.includes("거래일") ||
        c.includes("승인일") ||
        c.includes("날짜")
    );
    const hasAmount = colsLower.some(
      (c) =>
        c.includes("이용금액") ||
        c.includes("금액") ||
        c.includes("승인금액")
    );
    if (hasDate && hasAmount) {
      headerRowIndex = i;
      headers = cols.map((c) => c.trim());
      break;
    }
  }

  if (headerRowIndex === -1) {
    return {
      cardCompany,
      transactions: [],
      errors: ["헤더 행을 찾을 수 없습니다."],
      totalRows: 0,
    };
  }

  const transactions: ParsedTransaction[] = [];
  const dataLines = lines.slice(headerRowIndex + 1);
  let totalRows = 0;

  for (const line of dataLines) {
    if (!line.trim()) continue;
    totalRows++;

    try {
      const cols = splitCsvLine(line);
      const rawRow: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rawRow[h] = cols[idx] ?? "";
      });

      const tx = parseCardTransactionRow(
        rawRow,
        headers,
        cardFormat,
        cardCompany
      );
      if (tx) transactions.push(tx);
    } catch (e) {
      errors.push(`행 파싱 오류: ${line.slice(0, 50)} - ${e}`);
    }
  }

  return { cardCompany, transactions, errors, totalRows };
}

function parseCardTransactionRow(
  rawRow: Record<string, string>,
  headers: string[],
  cardFormat: CardFormat | null,
  cardCompany: string
): ParsedTransaction | null {
  // Find date column
  const dateKey = findMatchingKey(
    headers,
    cardFormat?.dateKey ?? ["이용일", "거래일", "날짜"]
  );
  if (!dateKey) return null;

  const rawDate = rawRow[dateKey] ?? "";
  const date = normalizeDate(rawDate);
  if (!date) return null;

  // Find amount column
  const amountKey = findMatchingKey(
    headers,
    cardFormat?.amountKey ?? ["이용금액", "금액", "승인금액"]
  );
  if (!amountKey) return null;

  const amount = parseAmount(rawRow[amountKey] ?? "");
  if (amount === 0) return null;

  // Find merchant column
  const merchantKey = findMatchingKey(
    headers,
    cardFormat?.merchantKey ?? ["가맹점명", "이용가맹점", "가맹점"]
  );
  const merchantName = merchantKey
    ? sanitize(rawRow[merchantKey] ?? "")
    : "알 수 없음";

  // Check if this is a refund (negative amount in some formats)
  const rawAmountStr = rawRow[amountKey] ?? "";
  const isRefund = rawAmountStr.includes("-") || rawAmountStr.includes("취소");
  const finalAmount = isRefund ? -Math.abs(amount) : Math.abs(amount);

  return {
    date,
    merchantName,
    amount: finalAmount,
    memo: null,
    originalCategory: null,
    bankOrCard: cardCompany,
    rawRow,
  };
}

function findMatchingKey(
  headers: string[],
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    const match = headers.find(
      (h) =>
        h.toLowerCase().includes(candidate.toLowerCase()) ||
        candidate.toLowerCase().includes(h.toLowerCase())
    );
    if (match) return match;
  }
  return null;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[,원\s]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.abs(n);
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const dateOnly = raw.split(" ")[0];
  const cleaned = dateOnly.replace(/[./년월일T]/g, "-").replace(/-+$/, "");
  const parts = cleaned.split("-").filter(Boolean);

  if (parts.length >= 3) {
    const year = parts[0].length === 2 ? `20${parts[0]}` : parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function sanitize(s: string): string {
  return s.replace(/[<>"'&]/g, "").trim().slice(0, 200);
}
