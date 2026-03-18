import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, MapPin, AlertTriangle } from "lucide-react";

const highlights = [
  {
    icon: TrendingUp,
    title: "플랫폼별 매출 트렌드",
    desc: "네이버, 카카오맵, 구글 매출을 한눈에",
  },
  {
    icon: MapPin,
    title: "동네 매출 랭킹",
    desc: "우리 매장이 동네에서 몇 등인지 확인",
  },
  {
    icon: AlertTriangle,
    title: "AI 문제 감지",
    desc: "매출 이상, 부정 리뷰 급증을 자동 알림",
  },
];

export function RevenuePreviewSection() {
  return (
    <section id="revenue-preview" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: copy */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "oklch(0.95 0.03 160)",
                color: "oklch(0.45 0.18 160)",
              }}
            >
              세리 &middot; AI 매출분석
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              매출 분석도
              <br />
              AI가 알아서 해드려요
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              플랫폼 연동만 하면 세리가 매출 데이터를 분석하고,
              <br className="hidden sm:block" />
              문제가 생기면 바로 알려드립니다.
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "oklch(0.95 0.03 160)" }}
                    >
                      <Icon
                        className="size-4.5"
                        style={{ color: "oklch(0.45 0.18 160)" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <a href="/auth/login">
                <Button
                  size="lg"
                  className="rounded-full px-8 text-base font-semibold shadow-lg"
                  style={{
                    backgroundColor: "oklch(0.45 0.18 160)",
                    color: "white",
                  }}
                >
                  세리와 매출 분석 시작하기
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right: mini dashboard mock */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-xl">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100">
          <TrendingUp className="size-3.5 text-emerald-600" />
        </div>
        <span className="text-sm font-semibold text-gray-800">세리 매출 분석</span>
      </div>

      {/* Mini chart bars */}
      <div className="rounded-xl bg-white p-4">
        <p className="text-xs font-medium text-gray-500">이번 주 매출</p>
        <p className="mt-1 text-xl font-bold text-gray-900">1,520만원</p>
        <p className="text-xs text-green-600">+12% vs 지난주</p>

        <div className="mt-4 flex items-end gap-1.5">
          {[65, 45, 72, 58, 80, 68, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}px`,
                backgroundColor:
                  i === 6
                    ? "oklch(0.45 0.18 160)"
                    : "oklch(0.92 0.03 160)",
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span>토</span>
          <span className="font-semibold text-gray-600">일</span>
        </div>
      </div>

      {/* Alert preview */}
      <div className="mt-3 rounded-xl bg-amber-50 p-3">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700">
            화요일 매출 15% 하락 감지
          </span>
        </div>
        <p className="mt-1 text-[10px] text-amber-600">
          세리가 원인을 분석하고 있습니다
        </p>
      </div>
    </div>
  );
}
