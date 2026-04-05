import Link from "next/link";

const features = [
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
    <section id="pricing" className="bg-[#F8FAFC] py-20 sm:py-28">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] [word-break:keep-all] sm:text-3xl">
            요금 안내
          </h2>
        </div>

        {/* Pricing Card */}
        <div className="mt-8 overflow-hidden rounded-2xl border-2 border-[#1E40AF] bg-white shadow-xl">
          {/* Card header */}
          <div className="border-b border-[#E2E8F0] px-6 py-6 text-center">
            <p className="text-sm font-semibold tracking-wide text-[#64748B]">
              점장 고용비
            </p>
            <p className="mt-2 text-5xl font-bold text-[#1E293B]">
              월{" "}
              <span className="text-[#1E40AF]">29,700원</span>
            </p>
            <p className="mt-1.5 text-sm text-[#64748B]">
              (하루 990원, 커피 한 잔 값)
            </p>
          </div>

          {/* Feature list */}
          <div className="px-6 py-6">
            <ul className="space-y-3">
              {features.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm text-[#1E293B]">
                  <span className="mt-0.5 shrink-0 text-[#10B981]">✅</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <Link href="/auth/signup" className="block">
              <button
                className="h-14 w-full rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1E40AF" }}
              >
                7일 무료 체험 시작하기 →
              </button>
            </Link>
            <p className="mt-3 text-center text-xs leading-relaxed text-[#64748B]">
              카드 등록 없이 · 자동 결제 없음 · 7일 후 직접 결정하세요
            </p>
          </div>
        </div>

        {/* Bottom quote */}
        <p className="mt-6 text-center text-base font-semibold text-[#1E293B] [word-break:keep-all]">
          &ldquo;구독료가 아니에요. 점장 월급이에요.&rdquo;
        </p>
      </div>
    </section>
  );
}
