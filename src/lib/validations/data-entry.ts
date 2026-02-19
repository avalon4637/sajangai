import { z } from "zod";

// Revenue entry validation schema
export const RevenueSchema = z.object({
  date: z.coerce
    .date({ message: "올바른 날짜를 입력해주세요" })
    .max(new Date(), "미래 날짜는 입력할 수 없습니다"),
  amount: z
    .number({ message: "금액을 입력해주세요" })
    .int("금액은 정수로 입력해주세요")
    .min(1, "금액은 1원 이상이어야 합니다")
    .max(999999999999, "금액이 너무 큽니다"),
  channel: z
    .string()
    .max(50, "결제 방법은 50자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
  category: z
    .string()
    .max(50, "카테고리는 50자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
  memo: z
    .string()
    .max(500, "메모는 500자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
});

// Expense entry validation schema
export const ExpenseSchema = z.object({
  date: z.coerce
    .date({ message: "올바른 날짜를 입력해주세요" })
    .max(new Date(), "미래 날짜는 입력할 수 없습니다"),
  type: z.enum(["fixed", "variable"], {
    message: "비용 유형을 선택해주세요",
  }),
  category: z
    .string()
    .min(1, "카테고리를 입력해주세요")
    .max(50, "카테고리는 50자 이하여야 합니다"),
  amount: z
    .number({ message: "금액을 입력해주세요" })
    .int("금액은 정수로 입력해주세요")
    .min(1, "금액은 1원 이상이어야 합니다")
    .max(999999999999, "금액이 너무 큽니다"),
  memo: z
    .string()
    .max(500, "메모는 500자 이하여야 합니다")
    .optional()
    .or(z.literal("")),
});

// Fixed cost entry validation schema
export const FixedCostSchema = z.object({
  category: z
    .string()
    .min(1, "카테고리를 입력해주세요")
    .max(50, "카테고리는 50자 이하여야 합니다"),
  amount: z
    .number({ message: "금액을 입력해주세요" })
    .int("금액은 정수로 입력해주세요")
    .min(1, "금액은 1원 이상이어야 합니다")
    .max(999999999999, "금액이 너무 큽니다"),
  is_labor: z.boolean().default(false),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
});

// Inferred types from schemas
export type RevenueFormData = z.infer<typeof RevenueSchema>;
export type ExpenseFormData = z.infer<typeof ExpenseSchema>;
export type FixedCostFormData = z.infer<typeof FixedCostSchema>;
