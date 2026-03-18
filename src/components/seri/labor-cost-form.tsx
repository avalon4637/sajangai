"use client";

// Labor cost form for SPEC-SERI-002
// Record employee salary payments

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LaborEntry {
  id: string;
  name: string;
  payDate: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
}

interface LaborCostFormProps {
  initialEntries?: LaborEntry[];
  onSave?: (entry: Omit<LaborEntry, "id">) => Promise<void>;
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

export function LaborCostForm({
  initialEntries = [],
  onSave,
}: LaborCostFormProps) {
  const [entries, setEntries] = useState<LaborEntry[]>(initialEntries);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [payDate, setPayDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [grossAmount, setGrossAmount] = useState("");
  const [deductions, setDeductions] = useState("");

  const netAmount =
    (parseInt(grossAmount.replace(/,/g, ""), 10) || 0) -
    (parseInt(deductions.replace(/,/g, ""), 10) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !grossAmount) return;

    const entry: Omit<LaborEntry, "id"> = {
      name: name.trim(),
      payDate,
      grossAmount: parseInt(grossAmount.replace(/,/g, ""), 10) || 0,
      deductions: parseInt(deductions.replace(/,/g, ""), 10) || 0,
      netAmount,
    };

    setIsSaving(true);
    try {
      await onSave?.(entry);
      setEntries((prev) => [
        ...prev,
        { ...entry, id: Date.now().toString() },
      ]);
      // Reset form
      setName("");
      setGrossAmount("");
      setDeductions("");
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const totalGross = entries.reduce((s, e) => s + e.grossAmount, 0);
  const totalNet = entries.reduce((s, e) => s + e.netAmount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            인건비 관리
          </CardTitle>
          {!isAdding && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              급여 추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-4 border rounded-lg space-y-4 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="labor-name" className="text-xs">
                  이름
                </Label>
                <Input
                  id="labor-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="labor-date" className="text-xs">
                  지급일
                </Label>
                <Input
                  id="labor-date"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="labor-gross" className="text-xs">
                  세전 금액
                </Label>
                <Input
                  id="labor-gross"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  placeholder="2,500,000"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="labor-deductions" className="text-xs">
                  공제액
                </Label>
                <Input
                  id="labor-deductions"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="225,000"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Net amount display */}
            <div className="flex items-center justify-between p-3 bg-background rounded-md border text-sm">
              <span className="text-muted-foreground">실지급액</span>
              <span className="font-semibold text-lg">
                {formatAmount(Math.max(0, netAmount))}
              </span>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                취소
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        )}

        {/* Monthly summary table */}
        {entries.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>이름</TableHead>
                  <TableHead>지급일</TableHead>
                  <TableHead className="text-right">세전</TableHead>
                  <TableHead className="text-right">공제</TableHead>
                  <TableHead className="text-right">실지급</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className="text-sm">
                    <TableCell>{entry.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {entry.payDate}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(entry.grossAmount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatAmount(entry.deductions)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(entry.netAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="flex justify-between items-center px-1 text-sm font-medium border-t pt-3">
              <span>이번 달 합계</span>
              <div className="text-right">
                <div className="text-muted-foreground text-xs">
                  세전 {formatAmount(totalGross)}
                </div>
                <div className="text-base">{formatAmount(totalNet)}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            급여 지급 내역이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
