"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invoice, OutstandingBalance } from "@/lib/queries/invoice";
import { toast } from "sonner";
import { markInvoiceAsPaid, addInvoice } from "@/lib/actions/invoice-actions";
import { formatAmount } from "@/lib/utils/format-currency";


// Format date as MM/DD
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

interface InvoicesPageClientProps {
  invoices: Invoice[];
  balance: OutstandingBalance;
  activeType: "receivable" | "payable";
}

export function InvoicesPageClient({
  invoices,
  balance,
  activeType,
}: InvoicesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Count pending/overdue invoices for current type
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "overdue"
  );
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Tab switch handler
  function handleTabChange(type: "receivable" | "payable"): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    router.push(`/invoices?${params.toString()}`);
  }

  // Mark as paid handler
  function handleMarkPaid(invoiceId: string): void {
    startTransition(async () => {
      const result = await markInvoiceAsPaid(invoiceId);
      if (!result.success) {
        toast.error(result.error ?? "처리 실패");
      }
    });
  }

  // Add invoice handler
  async function handleAddInvoice(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const input = {
      type: (formData.get("type") as "receivable" | "payable") || activeType,
      counterparty: formData.get("counterparty") as string,
      supplyAmount: Number(formData.get("supplyAmount")),
      taxAmount: Number(formData.get("taxAmount")),
      issueDate: formData.get("issueDate") as string,
      dueDate: (formData.get("dueDate") as string) || undefined,
      memo: (formData.get("memo") as string) || undefined,
    };

    startTransition(async () => {
      const result = await addInvoice(input);
      if (result.success) {
        setDialogOpen(false);
        form.reset();
      } else {
        toast.error(result.error ?? "등록 실패");
      }
    });
  }

  // Status badge component
  function StatusBadge({ status }: { status: string }) {
    switch (status) {
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="size-3 mr-1" />
            발행완료
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="size-3 mr-1" />
            연체
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="size-3 mr-1" />
            미발행
          </Badge>
        );
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-amber-500" />
            <span className="text-muted-foreground">
              미처리 <strong className="text-foreground">{pendingInvoices.length}건</strong>
              {" "}합계{" "}
              <strong className="text-foreground">{formatAmount(pendingTotal)}</strong>
            </span>
            {balance.overdueCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                연체 {balance.overdueCount}건
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeType === "receivable" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTabChange("receivable")}
        >
          매출 세금계산서
        </Button>
        <Button
          variant={activeType === "payable" ? "default" : "outline"}
          size="sm"
          onClick={() => handleTabChange("payable")}
        >
          매입 세금계산서
        </Button>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium text-sm mb-1">
              {activeType === "receivable"
                ? "아직 매출 세금계산서가 없습니다"
                : "아직 매입 세금계산서가 없습니다"}
            </p>
            <p className="text-muted-foreground text-xs mb-4">
              {activeType === "receivable"
                ? "거래처에 발행한 세금계산서를 등록하세요"
                : "거래처로부터 받은 세금계산서를 등록하세요"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4 mr-1" />
              세금계산서 등록
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            // Estimate supply/tax from total (10% VAT assumption)
            const supplyEstimate = Math.round(inv.amount / 1.1);
            const taxEstimate = inv.amount - supplyEstimate;

            return (
              <Card key={inv.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(inv.issue_date)}
                        </span>
                        <span className="font-semibold text-sm truncate">
                          {inv.counterparty}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground" title="실제 공급가는 세금계산서를 확인하세요">
                        공급가(추정) {formatAmount(supplyEstimate)} / 세액(추정){" "}
                        {formatAmount(taxEstimate)}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        합계 {formatAmount(inv.amount)}
                      </div>
                      {inv.due_date && inv.status !== "paid" && (
                        <div className="text-xs text-muted-foreground mt-1">
                          납부기한: {inv.due_date}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={inv.status} />
                      {inv.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleMarkPaid(inv.id)}
                          className="text-xs"
                        >
                          발행 처리
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add invoice dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <Plus className="size-4 mr-2" />
            계산서 추가
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계산서 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInvoice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-type">유형</Label>
              <Select name="type" defaultValue={activeType}>
                <SelectTrigger id="inv-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receivable">매출 (수취)</SelectItem>
                  <SelectItem value="payable">매입 (지급)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-counterparty">거래처명</Label>
              <Input
                id="inv-counterparty"
                name="counterparty"
                placeholder="거래처명 입력"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-supply">공급가액</Label>
                <Input
                  id="inv-supply"
                  name="supplyAmount"
                  type="number"
                  placeholder="0"
                  min={0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-tax">세액</Label>
                <Input
                  id="inv-tax"
                  name="taxAmount"
                  type="number"
                  placeholder="0"
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-issue">발행일</Label>
                <Input
                  id="inv-issue"
                  name="issueDate"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due">납부기한</Label>
                <Input id="inv-due" name="dueDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-memo">메모</Label>
              <Input id="inv-memo" name="memo" placeholder="메모 (선택)" />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "등록 중..." : "등록"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
