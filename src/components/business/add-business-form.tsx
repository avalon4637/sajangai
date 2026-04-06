"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBusiness } from "@/lib/actions/business-add";

export function AddBusinessForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const businessNumber = (formData.get("businessNumber") as string).replace(
      /[^0-9]/g,
      "",
    );
    const businessType = formData.get("businessType") as string;
    const address = formData.get("address") as string;

    if (!name.trim()) {
      setError("상호명을 입력해 주세요.");
      setIsLoading(false);
      return;
    }

    if (businessNumber.length !== 10) {
      setError("사업자등록번호 10자리를 입력해 주세요.");
      setIsLoading(false);
      return;
    }

    const result = await addBusiness({
      name: name.trim(),
      businessNumber,
      businessType: businessType?.trim() || undefined,
      address: address?.trim() || undefined,
    });

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error ?? "사업장 등록에 실패했습니다.");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">상호명 *</Label>
        <Input
          id="name"
          name="name"
          placeholder="예: 맛있는 짬뽕집"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessNumber">사업자등록번호 *</Label>
        <Input
          id="businessNumber"
          name="businessNumber"
          placeholder="000-00-00000"
          maxLength={12}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          숫자 10자리를 입력해 주세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">업종 (선택)</Label>
        <Input
          id="businessType"
          name="businessType"
          placeholder="예: 음식점, 카페, 소매업"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">주소 (선택)</Label>
        <Input
          id="address"
          name="address"
          placeholder="예: 서울시 강남구 역삼동 123-4"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "등록 중..." : "사업장 등록"}
      </Button>
    </form>
  );
}
