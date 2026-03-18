// Bank statement CSV parser for SPEC-SERI-002
// Supports major Korean banks: 신한, 국민, 우리, 하나, 농협, 카카오뱅크, 토스뱅크

import type { ParsedTransaction } from "@/types/bookkeeping";

// @MX:ANCHOR: Entry point for bank statement parsing. Called by statement-upload component.
// @MX:REASON: Multiple callers expected; format detection is safety-critical.

export interface BankParseResult {
  bankName: string;
  transactions: ParsedTransaction[];
  errors: string[];
  totalRows: number;
}

type BankFormat = {
  name: string;
  keywords: string[];
  dateKey: string[];
  withdrawKey: string[];
  depositKey: string[];
  merchantKey: string[];
  balanceKey: string[];
};

const BANK_FORMATS: BankFormat[] = [
  {
    name: "신한은행",
    keywords: ["신한은행", "shinhan"],
    dateKey: ["거래일시", "거래일", "날짜"],
    withdrawKey: ["출금", "출금금액", "출금액"],
    depositKey: ["입금", "입금금액", "입금액"],
    merchantKey: ["적요", "내용", "거래내용"],
    balanceKey: ["잔액", "잔금"],
  },
  {
    name: "국민은행",
    keywords: ["국민은행", "kb", "kookmin"],
    dateKey: ["거래일", "날짜", "거래일자"],
    withdrawKey: ["출금액", "출금"],
    depositKey: ["입금액", "입금"],
    merchantKey: ["적요", "내용", "기재내용"],
    balanceKey: ["잔액"],
  },
  {
    name: "우리은행",
    keywords: ["우리은행", "woori"],
    dateKey: ["거래일시", "거래일", "날짜"],
    withdrawKey: ["출금", "출금금액"],
    depositKey: ["입금", "입금금액"],
    merchantKey: ["적요", "내용"],
    balanceKey: ["잔액"],
  },
  {
    name: "하나은행",
    keywords: ["하나은행", "hana"],
    dateKey: ["거래일", "거래일시"],
    withdrawKey: ["출금", "출금액"],
    depositKey: ["입금", "입금액"],
    merchantKey: ["적요", "내용"],
    balanceKey: ["잔액"],
  },
  {
    name: "농협은행",
    keywords: ["농협", "nonghyup", "nh"],
    dateKey: ["거래일자", "날짜", "거래일"],
    withdrawKey: ["출금", "출금액"],
    depositKey: ["입금", "입금액"],
    merchantKey: ["적요", "내용"],
    balanceKey: ["잔액"],
  },
  {
    name: "카카오뱅크",
    keywords: ["카카오뱅크", "kakaobank"],
    dateKey: ["거래일시", "날짜"],
    withdrawKey: ["출금", "출금액", "출금금액"],
    depositKey: ["입금", "입금액", "입금금액"],
    merchantKey: ["거래내용", "적요", "내용"],
    balanceKey: ["잔액"],
  },
  {
    name: "토스뱅크",
    keywords: ["토스뱅크", "tossbank"],
    dateKey: ["거래일시", "날짜"],
    withdrawKey: ["출금", "출금액"],
    depositKey: ["입금", "입금액"],
    merchantKey: ["거래내용", "메모"],
    balanceKey: ["잔액"],
  },
];

/**
 * Detect bank format from CSV header lines.
 * Searches first 5 lines for bank name keywords.
 */
export function detectBankFormat(headerLines: string[]): BankFormat | null {
  const combined = headerLines.slice(0, 5).join(" ").toLowerCase();
  return BANK_FORMATS.find((fmt) =>
    fmt.keywords.some((kw) => combined.includes(kw.toLowerCase()))
  ) ?? null;
}

/**
 * Parse a bank statement CSV string into ParsedTransaction[].
 * Auto-detects encoding by checking for common Korean bank header patterns.
 */
export function parseBankStatement(csvContent: string): BankParseResult {
  const lines = csvContent.split(/\r?\n/);
  const errors: string[] = [];

  // Detect bank format from header
  const bankFormat = detectBankFormat(lines);
  const bankName = bankFormat?.name ?? "알 수 없는 은행";

  // Find header row (first row with recognizable column names)
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const cols = splitCsvLine(lines[i]);
    const colsLower = cols.map((c) => c.toLowerCase().trim());
    // Look for date-like column
    const hasDate = colsLower.some(
      (c) =>
        c.includes("거래일") ||
        c.includes("날짜") ||
        c.includes("일시") ||
        c.includes("date")
    );
    const hasAmount = colsLower.some(
      (c) =>
        c.includes("출금") ||
        c.includes("입금") ||
        c.includes("금액") ||
        c.includes("amount")
    );
    if (hasDate && hasAmount) {
      headerRowIndex = i;
      headers = cols.map((c) => c.trim());
      break;
    }
  }

  if (headerRowIndex === -1) {
    return {
      bankName,
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

      const tx = parseTransactionRow(rawRow, headers, bankFormat, bankName);
      if (tx) transactions.push(tx);
    } catch (e) {
      errors.push(`행 파싱 오류: ${line.slice(0, 50)} - ${e}`);
    }
  }

  return { bankName, transactions, errors, totalRows };
}

function parseTransactionRow(
  rawRow: Record<string, string>,
  headers: string[],
  bankFormat: BankFormat | null,
  bankName: string
): ParsedTransaction | null {
  // Find date column
  const dateKey = findMatchingKey(
    headers,
    bankFormat?.dateKey ?? ["거래일", "날짜", "거래일시", "거래일자"]
  );
  if (!dateKey) return null;

  const rawDate = rawRow[dateKey] ?? "";
  const date = normalizeDate(rawDate);
  if (!date) return null;

  // Find withdrawal column
  const withdrawKey = findMatchingKey(
    headers,
    bankFormat?.withdrawKey ?? ["출금", "출금액", "출금금액"]
  );
  // Find deposit column
  const depositKey = findMatchingKey(
    headers,
    bankFormat?.depositKey ?? ["입금", "입금액", "입금금액"]
  );

  const withdrawStr = withdrawKey ? rawRow[withdrawKey] ?? "" : "";
  const depositStr = depositKey ? rawRow[depositKey] ?? "" : "";

  const withdrawAmt = parseAmount(withdrawStr);
  const depositAmt = parseAmount(depositStr);

  // Skip rows where both are zero or empty
  if (withdrawAmt === 0 && depositAmt === 0) return null;

  // Positive = expense (withdrawal), negative = income (deposit)
  const amount = withdrawAmt > 0 ? withdrawAmt : -depositAmt;

  // Find merchant/description column
  const merchantKey = findMatchingKey(
    headers,
    bankFormat?.merchantKey ?? ["적요", "내용", "거래내용"]
  );
  const merchantName = merchantKey
    ? sanitize(rawRow[merchantKey] ?? "")
    : "알 수 없음";

  return {
    date,
    merchantName,
    amount,
    memo: null,
    originalCategory: null,
    bankOrCard: bankName,
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
  // Remove time portion if present (e.g., "2024-01-15 14:30:00" -> "2024-01-15")
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
