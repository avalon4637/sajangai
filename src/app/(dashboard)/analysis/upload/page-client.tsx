"use client";

// Upload page client component for SPEC-SERI-002
// Orchestrates statement upload and classification preview

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatementUpload } from "@/components/seri/statement-upload";
import { ClassificationPreview } from "@/components/seri/classification-preview";
import type { ParsedTransaction, ClassifiedTransaction } from "@/types/bookkeeping";

export function UploadPageClient() {
  const router = useRouter();
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [classifiedTransactions, setClassifiedTransactions] = useState<ClassifiedTransaction[]>([]);
  const [sourceName, setSourceName] = useState("");
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  const handleParsed = useCallback(
    async (transactions: ParsedTransaction[], source: string) => {
      setParsedTransactions(transactions);
      setSourceName(source);
      setClassifyError(null);
      setIsClassifying(true);

      try {
        const response = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions }),
        });

        if (!response.ok) {
          const err = await response.json() as { error?: string };
          throw new Error(err.error ?? "분류 중 오류가 발생했습니다.");
        }

        const data = await response.json() as { classified: ClassifiedTransaction[] };
        setClassifiedTransactions(data.classified);
        setStep("preview");
      } catch (error) {
        setClassifyError(
          error instanceof Error ? error.message : "분류 실패"
        );
      } finally {
        setIsClassifying(false);
      }
    },
    []
  );

  const handleSave = useCallback(
    async (transactions: ClassifiedTransaction[]) => {
      // Save transactions as expenses via server action
      const response = await fetch("/api/expenses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: transactions.map((t) => ({
            date: t.date,
            merchant_name: t.merchantName,
            amount: Math.abs(t.amount),
            major_category: t.majorCategory,
            sub_category: t.subCategory,
            bank_or_card: t.bankOrCard,
            memo: t.memo,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("저장에 실패했습니다.");
      }

      setStep("done");
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/analysis")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          분석으로
        </Button>
        <div>
          <h1 className="text-xl font-semibold">명세서 업로드</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            은행 거래내역서 또는 카드 이용내역서를 업로드하여 지출을 자동 분류합니다
          </p>
        </div>
      </div>

      {/* Step 1: Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1단계: 파일 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <StatementUpload onParsed={handleParsed} />
        </CardContent>
      </Card>

      {/* AI Classification loading */}
      {isClassifying && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>AI가 {parsedTransactions.length}건의 거래를 분류하고 있습니다...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classification error */}
      {classifyError && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{classifyError}</p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Classification Preview */}
      {step === "preview" && classifiedTransactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              2단계: 분류 확인 및 저장
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({sourceName})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClassificationPreview
              transactions={classifiedTransactions}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Done */}
      {step === "done" && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <div>
              <h3 className="font-semibold text-emerald-700">저장 완료!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                지출 내역이 가계부에 저장되었습니다.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setParsedTransactions([]);
                  setClassifiedTransactions([]);
                }}
              >
                다른 파일 업로드
              </Button>
              <Button onClick={() => router.push("/expense")}>
                지출 내역 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
