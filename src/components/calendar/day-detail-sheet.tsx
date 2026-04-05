"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/utils/format-currency";
import { RevenueSchema, ExpenseSchema } from "@/lib/validations/data-entry";
import { REVENUE_CHANNELS, REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/constants/categories";
import { createRevenue } from "@/lib/actions/revenue";
import { createExpense } from "@/lib/actions/expense";
import type { RevenueFormData, ExpenseFormData } from "@/types/data-entry";

interface RevenueItem {
  id: string;
  date: string;
  amount: number;
  channel: string | null;
  category: string | null;
  memo: string | null;
}

interface ExpenseItem {
  id: string;
  date: string;
  amount: number;
  type: string;
  category: string;
  memo: string | null;
  isFixedCost?: boolean;
}

interface DayDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string; // YYYY-MM-DD
  revenues: RevenueItem[];
  expenses: ExpenseItem[];
  onDataChanged: () => void;
}

type FormMode = null | "revenue" | "expense";

export function DayDetailSheet({
  open,
  onOpenChange,
  date,
  revenues,
  expenses,
  onDataChanged,
}: DayDetailSheetProps) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = format(dateObj, "M월 d일 (EEE)", { locale: ko });

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const netAmount = totalRevenue - totalExpense;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{formattedDate}</SheetTitle>
          <SheetDescription className="sr-only">
            {formattedDate} 매출/지출 상세
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {/* Revenue section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">매출 ({revenues.length}건)</h3>
              </div>
              <span className="text-sm font-medium text-emerald-600">
                {formatKRW(totalRevenue)}
              </span>
            </div>

            {revenues.length > 0 ? (
              <ul className="space-y-2">
                {revenues.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50/60 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {r.category || r.channel || "매출"}
                      </p>
                      {r.memo && (
                        <p className="text-xs text-gray-500 truncate">{r.memo}</p>
                      )}
                    </div>
                    <span className="font-medium text-emerald-700 shrink-0 ml-2">
                      {r.amount.toLocaleString()}원
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 py-2">등록된 매출이 없습니다</p>
            )}

            {formMode === "revenue" ? (
              <InlineRevenueForm
                date={date}
                onSuccess={() => {
                  setFormMode(null);
                  onDataChanged();
                }}
                onCancel={() => setFormMode(null)}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                onClick={() => setFormMode("revenue")}
              >
                <Plus className="size-3.5 mr-1" />
                매출 추가
              </Button>
            )}
          </section>

          {/* Expense section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="size-4 text-red-500" />
                <h3 className="text-sm font-semibold">매입/지출 ({expenses.length}건)</h3>
              </div>
              <span className="text-sm font-medium text-red-500">
                {formatKRW(totalExpense)}
              </span>
            </div>

            {expenses.length > 0 ? (
              <ul className="space-y-2">
                {expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50/60 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {e.category}
                        {e.isFixedCost && (
                          <span className="ml-1 text-xs text-orange-500 font-normal">
                            (고정비 자동)
                          </span>
                        )}
                      </p>
                      {e.memo && (
                        <p className="text-xs text-gray-500 truncate">{e.memo}</p>
                      )}
                    </div>
                    <span className="font-medium text-red-600 shrink-0 ml-2">
                      {e.amount.toLocaleString()}원
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 py-2">등록된 지출이 없습니다</p>
            )}

            {formMode === "expense" ? (
              <InlineExpenseForm
                date={date}
                onSuccess={() => {
                  setFormMode(null);
                  onDataChanged();
                }}
                onCancel={() => setFormMode(null)}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-red-500 hover:text-red-600 cursor-pointer"
                onClick={() => setFormMode("expense")}
              >
                <Plus className="size-3.5 mr-1" />
                지출 추가
              </Button>
            )}
          </section>

          {/* Daily net */}
          <section className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-gray-500" />
                <h3 className="text-sm font-semibold">일 수지</h3>
              </div>
              <span
                className={cn(
                  "text-base font-bold",
                  netAmount >= 0 ? "text-emerald-600" : "text-red-500"
                )}
              >
                {netAmount >= 0 ? "+" : ""}
                {formatKRW(netAmount)}
              </span>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Revenue Form                                                */
/* ------------------------------------------------------------------ */

function InlineRevenueForm({
  date,
  onSuccess,
  onCancel,
}: {
  date: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RevenueFormData>({
    resolver: zodResolver(RevenueSchema) as Resolver<RevenueFormData>,
    defaultValues: {
      date: new Date(date + "T00:00:00"),
      amount: undefined as unknown as number,
      channel: "",
      category: "",
      memo: "",
    },
  });

  function onSubmit(data: RevenueFormData) {
    startTransition(async () => {
      const result = await createRevenue(data);
      if (result.success) {
        toast.success("매출이 등록되었습니다");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 p-3 rounded-lg border bg-gray-50 space-y-3">
      <p className="text-xs font-medium text-gray-600">매출 추가</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">금액</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="금액"
            className="h-8 text-sm"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-xs text-destructive mt-0.5">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <Label className="text-xs">결제 방법</Label>
          <Select
            value={watch("channel") ?? ""}
            onValueChange={(val) => setValue("channel", val)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {REVENUE_CHANNELS.map((ch) => (
                <SelectItem key={ch} value={ch}>
                  {ch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">카테고리</Label>
          <Select
            value={watch("category") ?? ""}
            onValueChange={(val) => setValue("category", val)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {REVENUE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">메모</Label>
          <Input
            placeholder="메모 (선택)"
            className="h-8 text-sm"
            {...register("memo")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending} className="cursor-pointer">
          {isPending ? "등록 중..." : "등록"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="cursor-pointer">
          취소
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Expense Form                                                */
/* ------------------------------------------------------------------ */

function InlineExpenseForm({
  date,
  onSuccess,
  onCancel,
}: {
  date: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(ExpenseSchema) as Resolver<ExpenseFormData>,
    defaultValues: {
      date: new Date(date + "T00:00:00"),
      type: "variable" as const,
      category: "",
      amount: undefined as unknown as number,
      memo: "",
    },
  });

  const typeValue = watch("type");
  const filteredCategories =
    typeValue === "fixed"
      ? EXPENSE_CATEGORIES.filter((c) => c.dbType === "fixed" && c.major !== "인건비")
      : EXPENSE_CATEGORIES.filter((c) => c.dbType === "variable");

  function onSubmit(data: ExpenseFormData) {
    startTransition(async () => {
      const result = await createExpense(data);
      if (result.success) {
        toast.success("지출이 등록되었습니다");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 p-3 rounded-lg border bg-gray-50 space-y-3">
      <p className="text-xs font-medium text-gray-600">지출 추가</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">금액</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="금액"
            className="h-8 text-sm"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-xs text-destructive mt-0.5">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <Label className="text-xs">비용 유형</Label>
          <Select
            value={typeValue}
            onValueChange={(val: "fixed" | "variable") => {
              setValue("type", val);
              setValue("category", "");
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">고정비</SelectItem>
              <SelectItem value="variable">변동비</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">카테고리</Label>
          <Select
            value={watch("category")}
            onValueChange={(val) => setValue("category", val)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((group) => (
                <SelectGroup key={group.major}>
                  <SelectLabel>{group.major}</SelectLabel>
                  {group.subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive mt-0.5">{errors.category.message}</p>
          )}
        </div>
        <div>
          <Label className="text-xs">메모</Label>
          <Input
            placeholder="메모 (선택)"
            className="h-8 text-sm"
            {...register("memo")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending} className="cursor-pointer">
          {isPending ? "등록 중..." : "등록"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="cursor-pointer">
          취소
        </Button>
      </div>
    </form>
  );
}
