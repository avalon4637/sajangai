"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKRW } from "@/lib/utils/format-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DismissibleAlert } from "@/components/ui/dismissible-alert";
import type { LoanBalance } from "@/lib/queries/loan";

interface LoanListProps {
  loans: LoanBalance[];
  businessId: string;
}

export function LoanList({ loans, businessId }: LoanListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalDebt = loans.reduce((s, l) => s + l.remainingPrincipal, 0);
  const totalMonthly = loans.reduce((s, l) => s + (l.monthlyPayment ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        loanName: form.get("loanName"),
        institution: form.get("institution"),
        principal: Number(form.get("principal")),
        interestRate: Number(form.get("interestRate")),
        monthlyPayment: Number(form.get("monthlyPayment")),
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setShowForm(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">총 대출 잔액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatKRW(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">월 상환액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatKRW(totalMonthly)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">대출 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans.length}건</div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed cost tip */}
      <DismissibleAlert
        storageKey="dismiss-loan-fixed-cost-tip"
        className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
        icon={<Lightbulb className="size-4 text-blue-600 dark:text-blue-400" />}
      >
        <span className="text-sm text-blue-800 dark:text-blue-200">
          대출 상환금은 고정비로 등록하면 매월 자동으로 지출에 반영됩니다.{" "}
          <Link
            href="/fixed-costs"
            className="font-medium underline underline-offset-2 hover:text-blue-600"
          >
            고정비 관리로 이동
          </Link>
        </span>
      </DismissibleAlert>

      {/* Loan list */}
      {loans.length > 0 ? (
        <div className="space-y-3">
          {loans.map((loan) => (
            <Card key={loan.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{loan.loanName}</span>
                    {loan.institution && (
                      <Badge variant="outline" className="text-xs">{loan.institution}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    원금 {formatKRW(loan.principal)} / 잔액 {formatKRW(loan.remainingPrincipal)}
                    {loan.interestRate != null && ` / 금리 ${loan.interestRate}%`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatKRW(loan.monthlyPayment ?? 0)}/월</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">등록된 대출이 없습니다</p>
          </CardContent>
        </Card>
      )}

      {/* Add form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">대출 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="loanName">대출명 *</Label>
                  <Input id="loanName" name="loanName" placeholder="예: 사업자대출" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="institution">금융기관</Label>
                  <Input id="institution" name="institution" placeholder="예: 신한은행" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="principal">대출원금 *</Label>
                  <Input id="principal" name="principal" type="number" placeholder="50000000" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="interestRate">금리 (%)</Label>
                  <Input id="interestRate" name="interestRate" type="number" step="0.01" placeholder="4.5" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="monthlyPayment">월 납입금</Label>
                  <Input id="monthlyPayment" name="monthlyPayment" type="number" placeholder="500000" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "저장 중..." : "저장"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)}>대출 추가</Button>
      )}
    </div>
  );
}

