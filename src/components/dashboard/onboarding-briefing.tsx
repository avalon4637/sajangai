// Onboarding Briefing Component
// Shown to new users with no revenue data
// Guides them to connect data or manually input revenue

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BarChart3, Link2 } from "lucide-react";
import Link from "next/link";

interface OnboardingBriefingProps {
  businessName: string;
}

const features = [
  "어제 매출 현황과 전일 대비 변화",
  "미답변 리뷰 알림",
  "이상 징후 자동 감지",
] as const;

export function OnboardingBriefing({ businessName }: OnboardingBriefingProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Accent top border */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 md:px-6">
        <span className="text-xl" role="img" aria-label="점장">
          👨‍💼
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            안녕하세요! AI 점장입니다
          </h2>
          <p className="text-xs text-muted-foreground">
            {businessName} 사장님, 반갑습니다
          </p>
        </div>
      </div>

      <CardContent className="space-y-4 px-4 pb-4 pt-3 md:px-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          매출 데이터를 연결하면
          <br />
          매일 아침 여기에 오늘의 브리핑을 준비해 드려요.
        </p>

        {/* Feature list */}
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/revenue">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              매출 직접 입력하기
            </Link>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs"
            asChild
          >
            <Link href="/settings/connections">
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              데이터 연결하기
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
