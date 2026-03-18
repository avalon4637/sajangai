"use client";

// Invoice tracker for SPEC-SERI-002
// Tracks 미수금 (accounts receivable) and 미지급금 (accounts payable)

import { useState } from "react";
import { Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvoiceType = "미수금" | "미지급금";
type InvoiceStatus = "미결" | "연체" | "완료";

interface Invoice {
  id: string;
  type: InvoiceType;
  counterpart: string; // 거래처
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function getStatusBadge(invoice: Invoice) {
  if (invoice.status === "완료") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        완료
      </Badge>
    );
  }
  if (isOverdue(invoice.dueDate)) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        연체
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
      <Clock className="h-3 w-3 mr-1" />
      미결
    </Badge>
  );
}

type StatusFilter = "전체" | "미결" | "연체" | "완료";

interface InvoiceTrackerProps {
  initialInvoices?: Invoice[];
  onSave?: (invoice: Omit<Invoice, "id" | "status">) => Promise<void>;
  onConfirm?: (invoiceId: string) => Promise<void>;
}

export function InvoiceTracker({
  initialInvoices = [],
  onSave,
  onConfirm,
}: InvoiceTrackerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");

  // Form fields
  const [type, setType] = useState<InvoiceType>("미수금");
  const [counterpart, setCounterpart] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterpart || !amount || !dueDate) return;

    const newInvoice: Omit<Invoice, "id" | "status"> = {
      type,
      counterpart: counterpart.trim(),
      amount: parseInt(amount.replace(/,/g, ""), 10) || 0,
      issueDate,
      dueDate,
    };

    setIsSaving(true);
    try {
      await onSave?.(newInvoice);
      setInvoices((prev) => [
        ...prev,
        { ...newInvoice, id: Date.now().toString(), status: "미결" as InvoiceStatus },
      ]);
      // Reset
      setCounterpart("");
      setAmount("");
      setDueDate("");
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (invoiceId: string) => {
    await onConfirm?.(invoiceId);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "완료" as InvoiceStatus } : inv
      )
    );
  };

  // Filter invoices
  const filteredInvoices = (tabType: InvoiceType) =>
    invoices
      .filter((inv) => inv.type === tabType)
      .filter((inv) => {
        if (statusFilter === "전체") return true;
        if (statusFilter === "연체")
          return inv.status !== "완료" && isOverdue(inv.dueDate);
        return inv.status === statusFilter;
      });

  // Summary stats
  const totalReceivable = invoices
    .filter((i) => i.type === "미수금" && i.status !== "완료")
    .reduce((s, i) => s + i.amount, 0);

  const totalPayable = invoices
    .filter((i) => i.type === "미지급금" && i.status !== "완료")
    .reduce((s, i) => s + i.amount, 0);

  const overdueCount = invoices.filter(
    (i) => i.status !== "완료" && isOverdue(i.dueDate)
  ).length;

  const InvoiceList = ({ items }: { items: Invoice[] }) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          해당하는 내역이 없습니다.
        </div>
      ) : (
        items.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-3 border rounded-lg text-sm"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="font-medium truncate">{inv.counterpart}</div>
              <div className="text-xs text-muted-foreground font-mono">
                발행: {inv.issueDate} · 만기: {inv.dueDate}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="font-semibold">{formatAmount(inv.amount)}</div>
                <div>{getStatusBadge(inv)}</div>
              </div>
              {inv.status !== "완료" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleConfirm(inv.id)}
                >
                  {inv.type === "미수금" ? "입금 확인" : "지급 확인"}
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">미수금 / 미지급금</CardTitle>
          {!isAdding && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-xs text-blue-600 mb-1">총 미수금</div>
            <div className="font-semibold text-blue-700 text-sm">
              {formatAmount(totalReceivable)}
            </div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-xs text-red-600 mb-1">총 미지급금</div>
            <div className="font-semibold text-red-700 text-sm">
              {formatAmount(totalPayable)}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <div className="text-xs text-amber-600 mb-1">연체 건수</div>
            <div className="font-semibold text-amber-700 text-sm">
              {overdueCount}건
            </div>
          </div>
        </div>

        {/* Add form */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-4 border rounded-lg space-y-4 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">유형</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as InvoiceType)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="미수금">미수금 (받을 돈)</SelectItem>
                    <SelectItem value="미지급금">미지급금 (줄 돈)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-counterpart" className="text-xs">
                  거래처
                </Label>
                <Input
                  id="inv-counterpart"
                  value={counterpart}
                  onChange={(e) => setCounterpart(e.target.value)}
                  placeholder="(주)홍길동상회"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-amount" className="text-xs">
                  금액
                </Label>
                <Input
                  id="inv-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1,000,000"
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-issue" className="text-xs">
                  발행일
                </Label>
                <Input
                  id="inv-issue"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="inv-due" className="text-xs">
                  만기일
                </Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-sm"
                  required
                />
              </div>
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

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {(["전체", "미결", "연체", "완료"] as StatusFilter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={statusFilter === f ? "default" : "outline"}
              className="h-7 text-xs px-2"
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="미수금">
          <TabsList className="w-full">
            <TabsTrigger value="미수금" className="flex-1 text-xs">
              미수금 ({invoices.filter((i) => i.type === "미수금").length})
            </TabsTrigger>
            <TabsTrigger value="미지급금" className="flex-1 text-xs">
              미지급금 ({invoices.filter((i) => i.type === "미지급금").length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="미수금" className="mt-3">
            <InvoiceList items={filteredInvoices("미수금")} />
          </TabsContent>
          <TabsContent value="미지급금" className="mt-3">
            <InvoiceList items={filteredInvoices("미지급금")} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
