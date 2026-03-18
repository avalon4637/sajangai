"use client";

// Statement upload component for SPEC-SERI-002
// Drag-and-drop zone for bank/card CSV statements

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseBankStatement } from "@/lib/csv/bank-statement-parser";
import { parseCardStatement } from "@/lib/csv/card-statement-parser";
import type { ParsedTransaction } from "@/types/bookkeeping";

interface StatementUploadProps {
  onParsed: (transactions: ParsedTransaction[], sourceName: string) => void;
}

type ParseStatus = "idle" | "parsing" | "success" | "error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function StatementUpload({ onParsed }: StatementUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [detectedSource, setDetectedSource] = useState("");
  const [transactionCount, setTransactionCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setStatus("error");
        setStatusMessage("CSV 파일만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setStatus("error");
        setStatusMessage("파일 크기는 10MB 이하여야 합니다.");
        return;
      }

      setStatus("parsing");
      setStatusMessage("파싱 중...");

      try {
        const text = await file.text();

        // Try bank statement first, then card statement
        const bankResult = parseBankStatement(text);
        const cardResult = parseCardStatement(text);

        let transactions: ParsedTransaction[];
        let sourceName: string;

        // Use whichever produced more transactions
        if (bankResult.transactions.length >= cardResult.transactions.length) {
          transactions = bankResult.transactions;
          sourceName = bankResult.bankName;
        } else {
          transactions = cardResult.transactions;
          sourceName = cardResult.cardCompany;
        }

        if (transactions.length === 0) {
          setStatus("error");
          setStatusMessage(
            "거래 내역을 찾을 수 없습니다. 올바른 형식의 CSV 파일인지 확인하세요."
          );
          return;
        }

        setDetectedSource(sourceName);
        setTransactionCount(transactions.length);
        setStatus("success");
        setStatusMessage(`${transactions.length}건의 거래 내역을 인식했습니다.`);
        onParsed(transactions, sourceName);
      } catch (error) {
        setStatus("error");
        setStatusMessage(`파싱 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      }
    },
    [onParsed]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setStatus("idle");
    setStatusMessage("");
    setDetectedSource("");
    setTransactionCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : status === "error"
              ? "border-destructive bg-destructive/5"
              : status === "success"
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => status === "idle" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />

        {status === "idle" && (
          <div className="space-y-3">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                CSV 파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                은행 거래내역서 또는 카드 이용내역서 (최대 10MB)
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              지원: 신한, 국민, 우리, 하나, 농협, 카카오뱅크, 토스뱅크, 신한카드, 국민카드, 삼성카드, 현대카드
            </p>
          </div>
        )}

        {status === "parsing" && (
          <div className="space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">파싱 중...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto text-emerald-500" />
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Badge variant="secondary">{detectedSource}</Badge>
              </div>
              <p className="text-sm font-medium text-emerald-700">
                {statusMessage}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              다시 업로드
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-sm text-destructive">{statusMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              다시 시도
            </Button>
          </div>
        )}
      </div>

      {status === "success" && transactionCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{detectedSource}</span>에서{" "}
            <span className="font-medium text-foreground">{transactionCount}건</span>의 거래를 불러왔습니다.
            아래에서 분류를 확인하고 저장하세요.
          </span>
        </div>
      )}
    </div>
  );
}
