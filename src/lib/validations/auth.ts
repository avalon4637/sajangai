import { z } from "zod";

// Login validation schema
export const LoginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
});

// Signup validation schema with password confirmation
export const SignupSchema = z
  .object({
    email: z.string().email("올바른 이메일 주소를 입력해주세요"),
    password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// Onboarding validation schema for business registration
export const OnboardingSchema = z.object({
  name: z
    .string()
    .min(1, "사업장명을 입력해주세요")
    .max(100, "사업장명은 100자 이하여야 합니다"),
  business_type: z.string().optional(),
  address: z.string().optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof LoginSchema>;
export type SignupFormData = z.infer<typeof SignupSchema>;
export type OnboardingFormData = z.infer<typeof OnboardingSchema>;
