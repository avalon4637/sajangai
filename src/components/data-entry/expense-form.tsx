"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { ExpenseSchema } from "@/lib/validations/data-entry";
import { EXPENSE_CATEGORIES } from "@/lib/constants/categories";
import { createExpense, updateExpense } from "@/lib/actions/expense";
import type { ExpenseFormData, Expense } from "@/types/data-entry";

interface ExpenseFormProps {
  editingExpense?: Expense;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ExpenseForm({
  editingExpense,
  onCancel,
  onSuccess,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingExpense;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(ExpenseSchema) as Resolver<ExpenseFormData>,
    defaultValues: editingExpense
      ? {
          date: new Date(editingExpense.date),
          type: editingExpense.type,
          category: editingExpense.category,
          amount: editingExpense.amount,
          memo: editingExpense.memo ?? "",
        }
      : {
          date: new Date(),
          type: "variable" as const,
          category: "",
          amount: undefined as unknown as number,
          memo: "",
        },
  });

  const dateValue = watch("date");
  const typeValue = watch("type");

  // Filter categories based on selected expense type
  const filteredCategories =
    typeValue === "fixed"
      ? EXPENSE_CATEGORIES.filter(
          (c) => c.dbType === "fixed" && c.major !== "인건비"
        )
      : EXPENSE_CATEGORIES.filter((c) => c.dbType === "variable");

  function onSubmit(data: ExpenseFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateExpense(editingExpense.id, data)
        : await createExpense(data);

      if (result.success) {
        if (!isEditing) {
          reset();
        }
        onSuccess?.();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Date */}
        <div className="space-y-2">
          <Label>날짜</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {dateValue ? format(dateValue, "yyyy-MM-dd") : "날짜 선택"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => date && setValue("date", date)}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>비용 유형</Label>
          <Select
            value={typeValue}
            onValueChange={(val: "fixed" | "variable") => {
              setValue("type", val);
              setValue("category", "");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">고정비</SelectItem>
              <SelectItem value="variable">변동비</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>카테고리</Label>
          <Select
            value={watch("category")}
            onValueChange={(val) => setValue("category", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="카테고리 선택" />
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
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="expense-amount">금액</Label>
          <Input
            id="expense-amount"
            type="number"
            placeholder="금액 입력"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* Memo */}
        <div className="space-y-2">
          <Label htmlFor="expense-memo">메모</Label>
          <Input
            id="expense-memo"
            placeholder="메모 (선택)"
            {...register("memo")}
          />
          {errors.memo && (
            <p className="text-sm text-destructive">{errors.memo.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending
              ? isEditing
                ? "수정 중..."
                : "등록 중..."
              : isEditing
                ? "수정"
                : "등록"}
          </Button>
          {isEditing && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
