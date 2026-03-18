"use client";

// Classification preview component for SPEC-SERI-002
// Displays AI-classified transactions in an editable table

import { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MAJOR_CATEGORIES } from "@/types/bookkeeping";
import type { ClassifiedTransaction } from "@/types/bookkeeping";

interface ClassificationPreviewProps {
  transactions: ClassifiedTransaction[];
  onSave: (transactions: ClassifiedTransaction[]) => Promise<void>;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
        {Math.round(confidence * 100)}%
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
        {Math.round(confidence * 100)}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
      {Math.round(confidence * 100)}%
    </Badge>
  );
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  return new Intl.NumberFormat("ko-KR").format(abs) + "원";
}

export function ClassificationPreview({
  transactions,
  onSave,
}: ClassificationPreviewProps) {
  const [items, setItems] = useState<ClassifiedTransaction[]>(transactions);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const updateCategory = (index: number, category: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, majorCategory: category, confidence: 1.0 }
          : item
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const toSave = items.filter((item) => !item.isDuplicate);
      await onSave(toSave);
      setSavedCount(toSave.length);
    } finally {
      setIsSaving(false);
    }
  };

  const duplicateCount = items.filter((i) => i.isDuplicate).length;
  const lowConfidenceCount = items.filter(
    (i) => !i.isDuplicate && i.confidence < 0.5
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="text-muted-foreground">
          전체 <span className="font-semibold text-foreground">{items.length}건</span>
        </span>
        {duplicateCount > 0 && (
          <span className="text-amber-600">
            중복 의심 <span className="font-semibold">{duplicateCount}건</span>
          </span>
        )}
        {lowConfidenceCount > 0 && (
          <span className="text-red-600">
            낮은 신뢰도 <span className="font-semibold">{lowConfidenceCount}건</span>
          </span>
        )}
        {savedCount > 0 && (
          <span className="text-emerald-600">
            저장 완료 <span className="font-semibold">{savedCount}건</span>
          </span>
        )}
      </div>

      {/* Warning for low confidence items */}
      {lowConfidenceCount > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-amber-700">
            신뢰도가 낮은 {lowConfidenceCount}건의 분류를 확인하고 필요시 수정하세요.
          </span>
        </div>
      )}

      {/* Transaction table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-24 text-xs">날짜</TableHead>
                <TableHead className="text-xs">가맹점</TableHead>
                <TableHead className="text-xs text-right w-28">금액</TableHead>
                <TableHead className="text-xs w-36">분류</TableHead>
                <TableHead className="text-xs text-center w-16">신뢰도</TableHead>
                <TableHead className="text-xs text-center w-16">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow
                  key={index}
                  className={item.isDuplicate ? "opacity-50 bg-muted/30" : ""}
                >
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {item.date.slice(5)} {/* MM-DD */}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="line-clamp-1">{item.merchantName}</span>
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    <span className={item.amount < 0 ? "text-blue-600" : "text-foreground"}>
                      {item.amount < 0 ? "+" : ""}
                      {formatAmount(item.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.majorCategory}
                      onValueChange={(v) => updateCategory(index, v)}
                      disabled={item.isDuplicate}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MAJOR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <ConfidenceBadge confidence={item.confidence} />
                  </TableCell>
                  <TableCell className="text-center">
                    {item.isDuplicate ? (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        중복
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                        정상
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          중복 의심 항목은 저장에서 제외됩니다.
        </p>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "저장 중..." : `전체 저장 (${items.filter((i) => !i.isDuplicate).length}건)`}
        </Button>
      </div>
    </div>
  );
}
