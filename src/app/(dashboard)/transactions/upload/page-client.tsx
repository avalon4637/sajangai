"use client";

// Expense upload client component for SPEC-FINANCE-002 M1
// 3-step flow: Upload -> Classification Preview -> Confirmation

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bulkInsertExpenses } from "@/lib/actions/expense-upload";
import type { BulkExpenseRow } from "@/lib/actions/expense-upload";

// Keyword-based classification mapping
const KEYWORD_CATEGORIES: Record<string, { category: string; type: "fixed" | "variable" }> = {
  // Food ingredients
  "원두": { category: "식자재", type: "variable" },
  "식재료": { category: "식자재", type: "variable" },
  "식자재": { category: "식자재", type: "variable" },
  "농산물": { category: "식자재", type: "variable" },
  "육류": { category: "식자재", type: "variable" },
  "수산물": { category: "식자재", type: "variable" },
  "음료": { category: "식자재", type: "variable" },
  "우유": { category: "식자재", type: "variable" },
  "시럽": { category: "식자재", type: "variable" },
  // Fees
  "수수료": { category: "수수료", type: "variable" },
  "배달수수료": { category: "수수료", type: "variable" },
  "카드수수료": { category: "수수료", type: "variable" },
  "PG": { category: "수수료", type: "variable" },
  // Fixed costs
  "임대료": { category: "고정비용", type: "fixed" },
  "관리비": { category: "고정비용", type: "fixed" },
  "월세": { category: "고정비용", type: "fixed" },
  // Utilities
  "전기": { category: "운영비", type: "fixed" },
  "가스": { category: "운영비", type: "fixed" },
  "통신": { category: "운영비", type: "fixed" },
  "인터넷": { category: "운영비", type: "fixed" },
  "수도": { category: "운영비", type: "fixed" },
  // Labor
  "급여": { category: "인건비", type: "fixed" },
  "알바": { category: "인건비", type: "fixed" },
  "아르바이트": { category: "인건비", type: "fixed" },
  "인건비": { category: "인건비", type: "fixed" },
  // Supplies
  "소모품": { category: "소모품", type: "variable" },
  "일회용": { category: "소모품", type: "variable" },
  "포장": { category: "소모품", type: "variable" },
  "컵": { category: "소모품", type: "variable" },
  "봉투": { category: "소모품", type: "variable" },
  // Marketing
  "광고": { category: "마케팅", type: "variable" },
  "홍보": { category: "마케팅", type: "variable" },
  "이벤트": { category: "마케팅", type: "variable" },
  // Tax
  "세금": { category: "세금", type: "fixed" },
  "부가세": { category: "세금", type: "fixed" },
  "소득세": { category: "세금", type: "fixed" },
  "4대보험": { category: "세금", type: "fixed" },
};

interface ParsedRow {
  date: string;
  content: string;
  amount: number;
  category: string;
  type: "fixed" | "variable";
  confidence: number;
}

/**
 * Classify a transaction content string using keyword matching.
 */
function classifyByKeyword(content: string): {
  category: string;
  type: "fixed" | "variable";
  confidence: number;
} {
  const lower = content.toLowerCase();
  for (const [keyword, mapping] of Object.entries(KEYWORD_CATEGORIES)) {
    if (lower.includes(keyword)) {
      return { ...mapping, confidence: 70 };
    }
  }
  return { category: "기타", type: "variable", confidence: 30 };
}

/**
 * Parse CSV text into rows.
 * Expects columns: date, content/description, amount (negative = expense).
 * Auto-detects delimiter (comma or tab).
 */
function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  // Auto-detect delimiter
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const rows: ParsedRow[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;

    // Try to find date, content, amount columns
    const dateRaw = cols[0];
    const content = cols[1];
    const amountRaw = cols[cols.length - 1] || cols[2]; // Amount often last column

    // Parse date (accept YYYY-MM-DD, YYYY/MM/DD, MM/DD, etc.)
    const date = normalizeDate(dateRaw);
    if (!date) continue;

    // Parse amount (remove commas, handle negative)
    const amount = parseAmount(amountRaw);
    if (amount === 0) continue;

    const classification = classifyByKeyword(content);

    rows.push({
      date,
      content,
      amount: Math.abs(amount),
      category: classification.category,
      type: classification.type,
      confidence: classification.confidence,
    });
  }

  return rows;
}

/**
 * Normalize various date formats to YYYY-MM-DD.
 */
function normalizeDate(raw: string): string | null {
  // YYYY-MM-DD or YYYY/MM/DD
  let match = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }
  // MM/DD/YYYY
  match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) {
    return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  }
  // MM/DD (assume current year)
  match = raw.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const year = new Date().getFullYear();
    return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  }
  return null;
}

/**
 * Parse amount string, removing commas and currency symbols.
 */
function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Confidence badge colors
function confidenceBadge(confidence: number) {
  if (confidence >= 80) return "bg-emerald-100 text-emerald-700";
  if (confidence >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function UploadPageClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ count: number } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setParseError(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "xlsx" || ext === "xlsm" || ext === "xls") {
      setParseError(
        "Excel(.xlsx) 파일은 현재 지원 준비 중입니다. CSV로 내보내기 후 업로드해 주세요. (파일 > 다른 이름으로 저장 > CSV)"
      );
      return;
    }

    if (ext !== "csv" && ext !== "txt" && ext !== "tsv") {
      setParseError("지원하지 않는 파일 형식입니다. CSV 파일을 업로드해 주세요.");
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setParseError(
          "파싱된 거래가 없습니다. 파일 형식을 확인해 주세요. (날짜, 내용, 금액 열이 필요합니다)"
        );
        return;
      }

      setParsedRows(rows);
      setStep("preview");
    } catch (error) {
      console.error("[TransactionUpload] Failed to parse file:", error);
      setParseError("파일을 읽는 중 오류가 발생했습니다.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleCategoryChange = useCallback(
    (index: number, newCategory: string) => {
      setParsedRows((prev) =>
        prev.map((row, i) =>
          i === index ? { ...row, category: newCategory, confidence: 100 } : row
        )
      );
    },
    []
  );

  const handleBulkInsert = useCallback(async () => {
    setIsSaving(true);
    try {
      const rows: BulkExpenseRow[] = parsedRows.map((r) => ({
        date: r.date,
        content: r.content,
        amount: r.amount,
        category: r.category,
        type: r.type,
      }));

      const result = await bulkInsertExpenses(rows);

      if (!result.success) {
        setParseError(result.error ?? "저장에 실패했습니다.");
        return;
      }

      setSaveResult({ count: result.insertedCount ?? rows.length });
      setStep("done");
    } catch {
      setParseError("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [parsedRows]);

  const totalAmount = parsedRows.reduce((sum, r) => sum + r.amount, 0);

  const CATEGORY_OPTIONS = [
    "식자재", "소모품", "인건비", "고정비용", "운영비",
    "수수료", "마케팅", "세금", "대표교육비", "기타",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/transactions")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          거래 내역
        </Button>
        <div>
          <h1 className="text-xl font-semibold">매입 데이터 업로드</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            카드명세서, 은행거래내역을 업로드하세요
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              파일 업로드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xlsm"
                className="hidden"
                onChange={handleFileInput}
              />
              <FileSpreadsheet className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                파일을 끌어놓거나 클릭하여 선택하세요
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                .csv 지원 (.xlsx는 CSV로 변환 후 업로드)
              </p>
            </div>

            {parseError && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Classification Preview */}
      {step === "preview" && parsedRows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                {parsedRows.length}건 파싱 완료
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                합계: {totalAmount.toLocaleString()}원
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">날짜</th>
                    <th className="pb-2 pr-3 font-medium">내용</th>
                    <th className="pb-2 pr-3 font-medium text-right">금액</th>
                    <th className="pb-2 pr-3 font-medium">분류</th>
                    <th className="pb-2 font-medium">신뢰도</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                        {row.date.slice(5)}
                      </td>
                      <td className="py-2.5 pr-3 font-medium max-w-[200px] truncate">
                        {row.content}
                      </td>
                      <td className="py-2.5 pr-3 text-right whitespace-nowrap text-orange-600">
                        -{row.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-3">
                        <select
                          value={row.category}
                          onChange={(e) => handleCategoryChange(i, e.target.value)}
                          className="text-sm border rounded px-2 py-1 bg-white"
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${confidenceBadge(row.confidence)}`}
                        >
                          {row.confidence}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parseError && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setParsedRows([]);
                  setParseError(null);
                }}
              >
                다시 업로드
              </Button>
              <Button
                onClick={handleBulkInsert}
                disabled={isSaving}
                className="min-w-[140px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  `${parsedRows.length}건 일괄 등록`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Done */}
      {step === "done" && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="h-10 w-10 mx-auto text-emerald-600" />
            <div>
              <h3 className="font-semibold text-emerald-700">
                {saveResult?.count ?? 0}건 저장 완료!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                매입 내역이 가계부에 저장되었습니다.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setParsedRows([]);
                  setSaveResult(null);
                  setParseError(null);
                }}
              >
                다른 파일 업로드
              </Button>
              <Button onClick={() => router.push("/transactions")}>
                거래 내역 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
