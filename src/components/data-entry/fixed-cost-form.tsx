"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
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

import { FixedCostSchema } from "@/lib/validations/data-entry";
import {
  FIXED_COST_CATEGORIES,
  LABOR_COST_CATEGORIES,
} from "@/lib/constants/categories";
import { createFixedCost, updateFixedCost } from "@/lib/actions/fixed-cost";
import type { FixedCostFormData, FixedCost } from "@/types/data-entry";

interface FixedCostFormProps {
  editingFixedCost?: FixedCost;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function FixedCostForm({
  editingFixedCost,
  onCancel,
  onSuccess,
}: FixedCostFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingFixedCost;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FixedCostFormData>({
    resolver: zodResolver(FixedCostSchema) as Resolver<FixedCostFormData>,
    defaultValues: editingFixedCost
      ? {
          category: editingFixedCost.category,
          amount: editingFixedCost.amount,
          is_labor: editingFixedCost.is_labor,
          start_date: editingFixedCost.start_date
            ? new Date(editingFixedCost.start_date)
            : null,
          end_date: editingFixedCost.end_date
            ? new Date(editingFixedCost.end_date)
            : null,
        }
      : {
          category: "",
          amount: undefined as unknown as number,
          is_labor: false,
          start_date: null,
          end_date: null,
        },
  });

  const isLabor = watch("is_labor");
  const startDate = watch("start_date");
  const endDate = watch("end_date");

  // Dynamic category suggestions based on is_labor
  const categorySuggestions = isLabor
    ? LABOR_COST_CATEGORIES
    : FIXED_COST_CATEGORIES;

  function onSubmit(data: FixedCostFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateFixedCost(editingFixedCost.id, data)
        : await createFixedCost(data);

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
        {/* Is Labor */}
        <div className="space-y-2">
          <Label>유형</Label>
          <div className="flex h-9 items-center gap-2">
            <Checkbox
              checked={isLabor}
              onCheckedChange={(checked) => {
                setValue("is_labor", checked === true);
                setValue("category", "");
              }}
            />
            <span className="text-sm">인건비</span>
          </div>
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
              {categorySuggestions.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
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
          <Label htmlFor="fc-amount">월 금액</Label>
          <Input
            id="fc-amount"
            type="number"
            placeholder="금액 입력"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>시작일 (선택)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {startDate ? format(startDate, "yyyy-MM-dd") : "시작일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ?? undefined}
                onSelect={(date) => setValue("start_date", date ?? null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>종료일 (선택)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {endDate ? format(endDate, "yyyy-MM-dd") : "종료일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ?? undefined}
                onSelect={(date) => setValue("end_date", date ?? null)}
              />
            </PopoverContent>
          </Popover>
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
