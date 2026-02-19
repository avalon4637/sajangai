"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingSchema, type OnboardingFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OnboardingFormProps {
  userId: string;
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      name: "",
      business_type: "",
      address: "",
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    const supabase = createClient();
    const { error } = await supabase.from("businesses").insert({
      user_id: userId,
      name: data.name,
      business_type: data.business_type || null,
      address: data.address || null,
    });

    if (error) {
      setError("root", {
        message: "사업장 등록에 실패했습니다. 다시 시도해주세요.",
      });
      return;
    }

    router.push("/dashboard");
  };

  return (
    <Card>
        <CardHeader>
          <CardTitle>사업장 등록</CardTitle>
          <CardDescription>
            서비스를 이용하려면 사업장 정보를 등록해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">사업장명 *</Label>
              <Input
                id="name"
                placeholder="사업장명을 입력해주세요"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">업종</Label>
              <Input
                id="business_type"
                placeholder="예: 음식점, 카페, 소매업"
                {...register("business_type")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                placeholder="사업장 주소를 입력해주세요"
                {...register("address")}
              />
            </div>

            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "사업장 등록"}
            </Button>
          </form>
        </CardContent>
    </Card>
  );
}
