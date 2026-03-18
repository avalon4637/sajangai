import { X, Check, Clock, Zap } from "lucide-react";

const beforeItems = [
  "리뷰 플랫폼 3개를 매일 확인",
  "답변 하나에 5~10분 소요",
  "미응답 리뷰 계속 쌓임",
  "평점 하락 걱정",
];

const afterItems = [
  "카톡 알림으로 자동 확인",
  "AI 답변 승인까지 30초",
  "미응답 리뷰 제로",
  "꾸준한 답변으로 신뢰 상승",
];

export function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.985 0 0) 0%, oklch(0.97 0.01 250 / 0.3) 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          사용 전 vs 사용 후
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Before */}
          <div
            className="rounded-2xl border-2 p-6 sm:p-8"
            style={{
              borderColor: "oklch(0.85 0.04 15)",
              backgroundColor: "var(--landing-before-bg)",
            }}
          >
            <div className="mb-6 flex items-center gap-2">
              <Clock className="size-5 text-red-400" />
              <h3 className="text-lg font-bold text-gray-800">
                사장 AI 없이
              </h3>
            </div>
            <ul className="space-y-4">
              {beforeItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <X className="size-3 text-red-500" />
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-red-600">
                매일 30분 이상 소요
              </p>
            </div>
          </div>

          {/* After */}
          <div
            className="rounded-2xl border-2 p-6 shadow-lg sm:p-8"
            style={{
              borderColor: "var(--landing-primary-light)",
              backgroundColor: "var(--landing-after-bg)",
            }}
          >
            <div className="mb-6 flex items-center gap-2">
              <Zap className="size-5" style={{ color: "var(--landing-primary)" }} />
              <h3 className="text-lg font-bold text-gray-800">
                사장 AI 사용
              </h3>
            </div>
            <ul className="space-y-4">
              {afterItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "oklch(0.92 0.04 250)" }}
                  >
                    <Check className="size-3" style={{ color: "var(--landing-primary)" }} />
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <div
              className="mt-6 rounded-xl px-4 py-3 text-center"
              style={{ backgroundColor: "oklch(0.93 0.04 250)" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--landing-primary-dark)" }}
              >
                매일 3분이면 충분
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
