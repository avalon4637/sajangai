import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "./animate-on-scroll";

const freeFeatures = [
  "데이터 수집 주 1회",
  "AI 분석 제한적 제공",
  "기본 대시보드 이용",
];

const paidFeatures = [
  "매일 아침 카톡 리포트",
  "매출·리뷰·비용 자동 분석",
  "25가지 경영 인사이트",
  "AI 리뷰 답글 자동 생성",
  "원클릭 실행 (답글/문자/프로모션)",
  "월간 ROI 보고서",
  "점장과 자유 대화",
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 [word-break:keep-all] sm:text-3xl">
            요금 안내
          </h2>
        </div>

        {/* 2-column comparison */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Free trial */}
          <AnimateOnScroll delay={0}>
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
            <p className="text-sm font-semibold tracking-wide text-slate-500">
              무료 체험
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              0원{" "}
              <span className="text-sm font-normal text-slate-500">/ 7일</span>
            </p>
            <ul className="mt-6 space-y-3">
              {freeFeatures.map((feat) => (
                <li
                  key={feat}
                  className="flex items-start gap-3 text-sm text-slate-500"
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    &ndash;
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          </AnimateOnScroll>

          {/* Paid plan */}
          <AnimateOnScroll delay={150}>
          <div className="rounded-2xl border-2 border-primary bg-white p-6 ring-2 ring-primary/20">
            <p className="text-sm font-semibold tracking-wide text-primary">
              점장 고용
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              29,700원{" "}
              <span className="text-sm font-normal text-slate-500">/ 월</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              (하루 990원, 커피 한 잔 값)
            </p>
            <p className="mt-1 text-xs font-medium text-primary/80">
              3개월 10% 할인 | 12개월 30% 할인
            </p>
            <ul className="mt-6 space-y-3">
              {paidFeatures.map((feat) => (
                <li
                  key={feat}
                  className="flex items-start gap-3 text-sm text-slate-800"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
          </AnimateOnScroll>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            asChild
            className="h-14 w-full max-w-xs rounded-xl bg-blue-800 px-8 text-base font-semibold text-white hover:bg-blue-900"
          >
            <Link href="/auth/signup">7일 무료 체험 시작하기 →</Link>
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            카드 등록 없이 · 자동 결제 없음 · 7일 후 직접 결정하세요
          </p>
        </div>

        {/* Bottom quote */}
        <p className="mt-6 text-center text-base font-semibold text-slate-800 [word-break:keep-all]">
          &ldquo;구독료가 아니에요. 점장 월급이에요.&rdquo;
        </p>
      </div>
    </section>
  );
}
