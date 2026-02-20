"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { parseCsv, type ParsedRow } from "@/lib/csv/parser";
import { importCsvData, type ImportRow, type ImportResult } from "@/lib/actions/csv-import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ImportState = "idle" | "preview" | "importing" | "complete";

interface EditableRow extends ParsedRow {
  isError: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function CsvUploadZone() {
  const [state, setState] = useState<ImportState>("idle");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("CSV 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseCsv(content);

      const editableRows: EditableRow[] = result.rows.map((row) => ({
        ...row,
        isError: false,
        isDuplicate: false,
      }));

      setRows(editableRows);
      setParseErrors(result.errors);
      setState("preview");
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const updateRow = useCallback(
    (index: number, field: keyof ParsedRow, value: string | number) => {
      setRows((prev) =>
        prev.map((row, i) =>
          i === index ? { ...row, [field]: value } : row
        )
      );
    },
    []
  );

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validRows = rows.filter((r) => !r.isError);

  const handleImport = useCallback(() => {
    if (validRows.length === 0) return;

    const importRows: ImportRow[] = validRows.map((r) => ({
      date: r.date,
      channel: r.channel,
      category: r.category,
      amount: r.amount,
      type: r.type,
      memo: r.memo,
    }));

    setState("importing");
    startTransition(async () => {
      const result = await importCsvData(importRows);
      setImportResult(result);
      setState("complete");
    });
  }, [validRows]);

  const handleReset = useCallback(() => {
    setState("idle");
    setRows([]);
    setParseErrors([]);
    setFileName("");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (state === "idle") {
    return (
      <Card>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="rounded-full bg-muted p-4">
              <Upload className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                CSV 파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                .csv 파일만 지원 (최대 5MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "preview") {
    const errorRowCount = rows.filter((r) => r.isError).length;
    const duplicateRowCount = rows.filter((r) => r.isDuplicate).length;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5" />
              {fileName}
            </CardTitle>
            <CardDescription>
              <span className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {rows.length}건 파싱 완료
                </Badge>
                <Badge variant="default">
                  {validRows.length}건 유효
                </Badge>
                {errorRowCount > 0 && (
                  <Badge variant="destructive">
                    {errorRowCount}건 오류
                  </Badge>
                )}
                {duplicateRowCount > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {duplicateRowCount}건 중복 의심
                  </Badge>
                )}
                {parseErrors.length > 0 && (
                  <Badge variant="destructive">
                    {parseErrors.length}건 파싱 실패
                  </Badge>
                )}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parseErrors.length > 0 && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive mb-1">
                  파싱 오류
                </p>
                <ul className="text-sm text-destructive/80 space-y-0.5">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...외 {parseErrors.length - 5}건</li>
                  )}
                </ul>
              </div>
            )}

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">날짜</TableHead>
                    <TableHead className="w-[100px]">채널</TableHead>
                    <TableHead className="w-[120px]">카테고리</TableHead>
                    <TableHead className="w-[120px] text-right">금액</TableHead>
                    <TableHead className="w-[100px]">유형</TableHead>
                    <TableHead>메모</TableHead>
                    <TableHead className="w-[60px]">상태</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        row.isError && "bg-destructive/5",
                        row.isDuplicate && !row.isError && "bg-amber-50 dark:bg-amber-950/20"
                      )}
                    >
                      <TableCell>
                        <Input
                          value={row.date}
                          onChange={(e) =>
                            updateRow(index, "date", e.target.value)
                          }
                          className="h-7 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.channel}
                          onChange={(e) =>
                            updateRow(index, "channel", e.target.value)
                          }
                          className="h-7 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.category}
                          onChange={(e) =>
                            updateRow(index, "category", e.target.value)
                          }
                          className="h-7 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.amount}
                          onChange={(e) =>
                            updateRow(
                              index,
                              "amount",
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="h-7 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.type}
                          onValueChange={(value: "revenue" | "expense") =>
                            updateRow(index, "type", value)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue">수입</SelectItem>
                            <SelectItem value="expense">지출</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.memo}
                          onChange={(e) =>
                            updateRow(index, "memo", e.target.value)
                          }
                          className="h-7 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        {row.isDuplicate && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300 text-[10px] px-1"
                          >
                            중복
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeRow(index)}
                        >
                          <X className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleReset}>
                취소
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  `${validRows.length}건 임포트`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "importing") {
    return (
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="size-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">데이터를 임포트하고 있습니다...</p>
              <p className="text-sm text-muted-foreground mt-1">
                {validRows.length}건의 데이터를 처리 중입니다. 잠시만 기다려 주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "complete" && importResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            임포트 완료
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {importResult.success}
              </p>
              <p className="text-sm text-muted-foreground">등록 완료</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {importResult.failed}
              </p>
              <p className="text-sm text-muted-foreground">실패</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {importResult.skipped}
              </p>
              <p className="text-sm text-muted-foreground">건너뜀</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">
                  오류 상세
                </p>
              </div>
              <ul className="text-sm text-destructive/80 space-y-0.5">
                {importResult.errors.slice(0, 10).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 10 && (
                  <li>...외 {importResult.errors.length - 10}건</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleReset}>새 파일 임포트</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">대시보드로 이동</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
