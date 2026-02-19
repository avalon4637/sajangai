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

import { RevenueSchema } from "@/lib/validations/data-entry";
import { REVENUE_CHANNELS, REVENUE_CATEGORIES } from "@/lib/constants/categories";
import { createRevenue, updateRevenue } from "@/lib/actions/revenue";
import type { RevenueFormData, Revenue } from "@/types/data-entry";

interface RevenueFormProps {
  editingRevenue?: Revenue;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function RevenueForm({
  editingRevenue,
  onCancel,
  onSuccess,
}: RevenueFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingRevenue;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RevenueFormData>({
    resolver: zodResolver(RevenueSchema) as Resolver<RevenueFormData>,
    defaultValues: editingRevenue
      ? {
          date: new Date(editingRevenue.date),
          amount: editingRevenue.amount,
          channel: editingRevenue.channel ?? "",
          category: editingRevenue.category ?? "",
          memo: editingRevenue.memo ?? "",
        }
      : {
          date: new Date(),
          amount: undefined as unknown as number,
          channel: "",
          category: "",
          memo: "",
        },
  });

  const dateValue = watch("date");

  function onSubmit(data: RevenueFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateRevenue(editingRevenue.id, data)
        : await createRevenue(data);

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

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">금액</Label>
          <Input
            id="amount"
            type="number"
            placeholder="금액 입력"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* Channel */}
        <div className="space-y-2">
          <Label>결제 방법</Label>
          <Select
            value={watch("channel") ?? ""}
            onValueChange={(val) => setValue("channel", val)}
          >
            <SelectTrigger className="w-full">
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
          {errors.channel && (
            <p className="text-sm text-destructive">{errors.channel.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>카테고리</Label>
          <Select
            value={watch("category") ?? ""}
            onValueChange={(val) => setValue("category", val)}
          >
            <SelectTrigger className="w-full">
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
          {errors.category && (
            <p className="text-sm text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Memo */}
        <div className="space-y-2">
          <Label htmlFor="memo">메모</Label>
          <Input id="memo" placeholder="메모 (선택)" {...register("memo")} />
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
