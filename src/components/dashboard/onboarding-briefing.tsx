// Onboarding Briefing Component
// Shown to new users with no revenue data
// Guides them through a step-by-step checklist to get started

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Receipt,
  MessageSquare,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface OnboardingBriefingProps {
  businessName: string;
}

const steps = [
  {
    label: "데이터 연결하기",
    description: "배달앱/카드 매출을 자동으로 가져와요",
    href: "/settings/connections",
    icon: Link2,
  },
  {
    label: "매출/지출 입력하기",
    description: "직접 입력하거나 CSV로 업로드해요",
    href: "/revenue",
    icon: Receipt,
  },
  {
    label: "AI 점장에게 물어보기",
    description: "매출 분석, 리뷰 관리 등 무엇이든 물어보세요",
    href: "/chat",
    icon: MessageSquare,
  },
] as const;

export function OnboardingBriefing({ businessName }: OnboardingBriefingProps) {
  return (
    <Card className="overflow-hidden shadow-sm border">
      {/* Accent top border */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 md:px-6">
        <span className="text-xl" role="img" aria-label="점장">
          👨‍💼
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            시작하기
          </h2>
          <p className="text-xs text-muted-foreground">
            {businessName} 사장님, 아래 순서대로 진행해 보세요
          </p>
        </div>
      </div>

      <CardContent className="space-y-3 px-4 pb-4 pt-3 md:px-6">
        {/* Step-by-step checklist */}
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.label}
              href={step.href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 group"
            >
              {/* Step number indicator */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CircleDot className="h-4 w-4" />
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-muted-foreground mr-1.5">
                    {index + 1}.
                  </span>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          );
        })}

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center pt-1">
          데이터를 연결하면 매일 아침 AI 점장이 브리핑을 준비해 드려요
        </p>
      </CardContent>
    </Card>
  );
}
