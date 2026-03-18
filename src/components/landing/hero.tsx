import { Button } from "@/components/ui/button";
import { Bell, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24"
    >
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.97 0.03 250) 0%, oklch(0.99 0.01 200) 50%, oklch(1 0 0) 100%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              리뷰, 매출, 마케팅까지
              <br />
              <span style={{ color: "var(--landing-primary)" }}>
                AI 팀
              </span>
              이 대신 챙겨드립니다
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              답장이가 리뷰 답변을, 세리가 매출 분석을, 바이럴이 마케팅을.
              <br className="hidden sm:block" />
              매일 매장 운영에만 집중하세요.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
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
            <p className="mt-3 text-sm text-muted-foreground">
              가입만 하면 바로 시작 &middot; 카드 등록 없음 &middot; AI 3명이 대기 중
            </p>
          </div>

          {/* Right: KakaoTalk mock */}
          <div className="flex justify-center lg:justify-end">
            <KakaoMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function KakaoMock() {
  return (
    <div className="w-full max-w-xs">
      {/* Phone frame */}
      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-3 shadow-2xl">
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-gray-500">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-4 rounded-sm border border-gray-400">
              <div className="ml-px mt-px h-1.5 w-2.5 rounded-sm bg-gray-500" />
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="mt-1 rounded-2xl p-4"
          style={{ backgroundColor: "var(--landing-kakao)" }}
        >
          {/* Chat header */}
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex size-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: "var(--landing-primary)" }}
            >
              S
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">sajang.ai</p>
              <p className="text-xs text-gray-500">AI 점장</p>
            </div>
          </div>

          {/* Notification bubble */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <Bell className="size-3.5" style={{ color: "var(--landing-primary)" }} />
              sajang.ai 알림
            </div>
            <p className="text-sm font-medium text-gray-900">
              미응답 리뷰 3건이 있어요!
            </p>
            <p className="mt-1 text-xs text-gray-500">
              지금 확인하고 AI 답변을 승인해보세요.
            </p>
            <button
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--landing-primary)" }}
            >
              답변 확인하기
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          {/* Time */}
          <p className="mt-2 text-right text-xs text-gray-400">오후 2:30</p>
        </div>
      </div>
    </div>
  );
}
