import { Button } from "@/components/ui/button";
import { Users, Gift, Sparkles, ArrowRight } from "lucide-react";

const stats = [
  { icon: Users, label: "베타 사용자 모집 중" },
  { icon: Sparkles, label: "모든 기능 무료" },
  { icon: Gift, label: "얼리버드 특별 혜택" },
];

export function TrustSection() {
  return (
    <section id="trust" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            지금 베타 서비스 운영 중입니다
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            사장 AI는 현재 얼리버드 사용자를 모집하고 있습니다. 베타 기간
            동안 모든 기능을 무료로 사용할 수 있으며, 정식 출시 후에도 얼리버드
            특별 혜택을 드립니다.
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 px-6 py-6 text-center"
              >
                <div
                  className="flex size-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "oklch(0.95 0.02 250)" }}
                >
                  <Icon
                    className="size-5"
                    style={{ color: "var(--landing-primary)" }}
                  />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a href="/auth/login">
            <Button
              size="lg"
              className="rounded-full px-8 text-base font-semibold shadow-lg"
              style={{
                backgroundColor: "var(--landing-primary)",
                color: "var(--landing-primary-foreground)",
              }}
            >
              무료 체험 시작하기
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
