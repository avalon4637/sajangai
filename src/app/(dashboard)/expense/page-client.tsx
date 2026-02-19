"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/data-entry/month-picker";
import { ExpenseForm } from "@/components/data-entry/expense-form";
import { ExpenseTable } from "@/components/data-entry/expense-table";
import type { Expense } from "@/types/data-entry";

interface ExpensePageClientProps {
  expenses: Expense[];
}

export function ExpensePageClient({ expenses }: ExpensePageClientProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(
    undefined
  );

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const fixedTotal = expenses
    .filter((e) => e.type === "fixed")
    .reduce((sum, e) => sum + e.amount, 0);
  const variableTotal = expenses
    .filter((e) => e.type === "variable")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <MonthPicker basePath="/dashboard/expense" />
        <div className="flex gap-4 text-sm">
          <span>
            고정비:{" "}
            <span className="font-semibold text-destructive">
              {fixedTotal.toLocaleString("ko-KR")}원
            </span>
          </span>
          <span>
            변동비:{" "}
            <span className="font-semibold">
              {variableTotal.toLocaleString("ko-KR")}원
            </span>
          </span>
          <span>
            합계:{" "}
            <span className="font-semibold text-primary">
              {totalAmount.toLocaleString("ko-KR")}원
            </span>
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingExpense ? "비용 수정" : "비용 등록"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            key={editingExpense?.id ?? "new"}
            editingExpense={editingExpense}
            onCancel={() => setEditingExpense(undefined)}
            onSuccess={() => setEditingExpense(undefined)}
          />
        </CardContent>
      </Card>

      <ExpenseTable
        data={expenses}
        onEdit={(expense) => setEditingExpense(expense)}
      />
    </div>
  );
}
