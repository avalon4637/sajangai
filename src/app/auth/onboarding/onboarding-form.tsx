"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OnboardingSchema, type OnboardingFormData } from "@/lib/validations/auth";
import { registerBusiness, verifyBusinessNumber } from "@/lib/actions/business";
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

interface VerifiedBusiness {
  businessNumber: string;
  isActive: boolean;
  validMsg: string;
  // Data farm fields derived from NTS response
  industryCode?: string;
  regionCode?: string;
  regionNameKo?: string;
  nts_sector?: string;
  nts_type?: string;
}

// Human-readable labels for industry codes
const INDUSTRY_LABELS: Record<string, string> = {
  korean_restaurant: "한식당",
  cafe: "카페",
  chicken: "치킨점",
  bunsik: "분식점",
  retail: "소매점",
  chinese_restaurant: "중식당",
  japanese_restaurant: "일식당",
  pizza: "피자점",
  bakery: "베이커리",
  bar: "주점",
  convenience: "편의점",
  beauty: "미용실",
  other: "기타",
};

export function OnboardingForm() {
  const router = useRouter();

  // Business number verification state
  const [rawBusinessNumber, setRawBusinessNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState<VerifiedBusiness | null>(null);

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

  // Format a 10-digit string as XXX-XX-XXXXX for display
  const formatBusinessNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setRawBusinessNumber(raw);
    setVerified(null);
    setVerifyError(null);
  };

  const handleVerify = async () => {
    if (rawBusinessNumber.length !== 10) {
      setVerifyError("사업자등록번호 10자리를 모두 입력해주세요.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerified(null);

    const result = await verifyBusinessNumber(rawBusinessNumber);

    setIsVerifying(false);

    if (!result.success) {
      setVerifyError(result.error ?? "인증에 실패했습니다.");
      return;
    }

    if (!result.isActive) {
      setVerifyError(
        `${result.validMsg ?? "휴폐업 사업자입니다."} 계속 사업 중인 사업자만 등록 가능합니다.`
      );
      return;
    }

    setVerified({
      businessNumber: result.businessNumber ?? rawBusinessNumber,
      isActive: result.isActive,
      validMsg: result.validMsg ?? "계속사업자",
      industryCode: result.industryCode,
      regionCode: result.regionCode,
      regionNameKo: result.regionNameKo,
      nts_sector: result.bSector,
      nts_type: result.bType,
    });
  };

  const onSubmit = async (data: OnboardingFormData) => {
    // Block submission if business number field has content but is not verified
    if (rawBusinessNumber && !verified) {
      setVerifyError("사업자등록번호 인증을 완료해주세요.");
      return;
    }

    const result = await registerBusiness({
      name: data.name,
      business_type: data.business_type || undefined,
      address: data.address || undefined,
      // Pass data farm fields from NTS verification (all optional)
      business_number: verified?.businessNumber,
      industry_code: verified?.industryCode,
      region_code: verified?.regionCode,
      nts_sector: verified?.nts_sector,
      nts_type: verified?.nts_type,
    });

    if (!result.success) {
      setError("root", {
        message: result.error || "사업장 등록에 실패했습니다.",
      });
      return;
    }

    router.push("/auth/onboarding/preferences");
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl">🏪</span>
        </div>
        <CardTitle className="text-xl">사업장 등록</CardTitle>
        <CardDescription className="break-keep">
          사업장 정보를 입력하면 AI 점장이 맞춤 분석을 시작해요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Business registration number */}
          <div className="space-y-2">
            <Label htmlFor="businessNumber">
              사업자등록번호
              <span className="ml-1 text-xs text-muted-foreground">(선택)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="businessNumber"
                type="text"
                inputMode="numeric"
                placeholder="000-00-00000"
                value={formatBusinessNumber(rawBusinessNumber)}
                onChange={handleBusinessNumberChange}
                className="flex-1"
                aria-describedby={verifyError ? "verify-error" : undefined}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleVerify}
                disabled={isVerifying || rawBusinessNumber.length !== 10}
                className="shrink-0"
              >
                {isVerifying ? "조회 중..." : "인증하기"}
              </Button>
            </div>

            {/* Verification error */}
            {verifyError && (
              <p id="verify-error" className="text-sm text-destructive">
                {verifyError}
              </p>
            )}

            {/* Verification success with auto-detected info */}
            {verified && (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800 space-y-1">
                <p className="font-medium">인증 완료</p>
                <p className="text-green-700">{verified.validMsg}</p>
                {/* Show auto-detected industry if available */}
                {verified.industryCode && verified.industryCode !== "other" && (
                  <p className="text-green-700 text-xs">
                    업종 자동 인식:{" "}
                    <span className="font-medium">
                      {INDUSTRY_LABELS[verified.industryCode] ?? verified.industryCode}
                    </span>
                    {" "}(변경 가능)
                  </p>
                )}
                {/* Show auto-detected region if available */}
                {verified.regionNameKo && (
                  <p className="text-green-700 text-xs">
                    지역 자동 인식:{" "}
                    <span className="font-medium">{verified.regionNameKo}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Business name */}
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

          {/* Business type - shows auto-filled hint when industry was detected */}
          <div className="space-y-2">
            <Label htmlFor="business_type">업종</Label>
            <Input
              id="business_type"
              placeholder={
                verified?.industryCode && verified.industryCode !== "other"
                  ? `자동 인식: ${INDUSTRY_LABELS[verified.industryCode] ?? verified.industryCode}`
                  : "예: 음식점, 카페, 소매업"
              }
              {...register("business_type")}
            />
          </div>

          {/* Address */}
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
