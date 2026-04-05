"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CommunicationStyle = "concise" | "detailed" | "conversational";
type FocusArea = "revenue" | "review" | "cost" | "all";
type NotificationTime = "morning" | "evening" | "both";

interface PreferencesFormProps {
  businessId: string;
}

const STYLE_OPTIONS: { value: CommunicationStyle; label: string; desc: string }[] = [
  { value: "concise", label: "간결하게", desc: "핵심 숫자와 결론만 알려주세요" },
  { value: "detailed", label: "상세하게", desc: "원인과 근거까지 자세히 알려주세요" },
  { value: "conversational", label: "대화하듯", desc: "편하게 이야기하듯 알려주세요" },
];

const FOCUS_OPTIONS: { value: FocusArea; label: string; desc: string }[] = [
  { value: "revenue", label: "매출", desc: "매출 변화와 채널 분석에 집중" },
  { value: "review", label: "리뷰", desc: "고객 평가와 답글 관리에 집중" },
  { value: "cost", label: "비용", desc: "비용 절감과 수익성에 집중" },
  { value: "all", label: "전체", desc: "매출, 리뷰, 비용 골고루 분석" },
];

const TIME_OPTIONS: { value: NotificationTime; label: string; desc: string }[] = [
  { value: "morning", label: "아침 (7시)", desc: "하루 시작 전 어제 현황 확인" },
  { value: "evening", label: "저녁 (9시)", desc: "영업 후 오늘 결산 확인" },
  { value: "both", label: "둘 다", desc: "아침 + 저녁 모두 받기" },
];

export function PreferencesForm({ businessId }: PreferencesFormProps) {
  const router = useRouter();
  const [style, setStyle] = useState<CommunicationStyle>("concise");
  const [focus, setFocus] = useState<FocusArea>("all");
  const [time, setTime] = useState<NotificationTime>("morning");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          communicationStyle: style,
          focusArea: focus,
          notificationTime: time,
        }),
      });

      if (!res.ok) throw new Error("저장 실패");

      router.push("/dashboard");
    } catch {
      setError("설정 저장에 실패했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">점장 설정</CardTitle>
        <CardDescription>
          AI 점장이 사장님 스타일에 맞게 일하도록 알려주세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Q1: Communication Style */}
        <div className="space-y-2">
          <p className="text-sm font-medium">리포트를 어떻게 받고 싶으세요?</p>
          <div className="grid gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                  style === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Q2: Focus Area */}
        <div className="space-y-2">
          <p className="text-sm font-medium">가장 관심 있는 영역은?</p>
          <div className="grid grid-cols-2 gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFocus(opt.value)}
                className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                  focus === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Q3: Notification Time */}
        <div className="space-y-2">
          <p className="text-sm font-medium">알림은 언제 받을까요?</p>
          <div className="grid gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTime(opt.value)}
                className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                  time === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => router.push("/dashboard")}
          >
            나중에 설정
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "저장 중..." : "설정 완료"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
