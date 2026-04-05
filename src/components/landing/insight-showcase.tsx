// S5 Insight Showcase — "점장이 이런 것까지 알려줘요"
// 4 KakaoTalk mockup cards in horizontal scroll (mobile) / grid (desktop)

import { KakaoMockup } from "@/components/landing/kakao-mockup";

const insights = [
  {
    title: "매출 급락 + 리뷰 연관",
    mockupMessage: "📉 매출 -32% 감지\n\n리뷰 미답변 3건이 원인이에요.\n지난달에도 같은 패턴이었어요.\nAI 답글 3건 준비했어요.",
    buttons: [{ label: "답글 등록하기" }],
    type: "alert" as const,
  },
  {
    title: "수수료 최적화",
    mockupMessage: "💸 수수료 절감 기회\n\n배민 15.7% vs 쿠팡 12.3%\n쿠팡 비중 올리면\n월 8만원 절감돼요.",
    buttons: [{ label: "프로모션 만들기" }],
    type: "action" as const,
  },
  {
    title: "단골 이탈 감지",
    mockupMessage: "👤 단골 고객 알림\n\n단골 5명이 2주째\n안 오고 있어요.\n재방문 문자 보낼까요?",
    buttons: [{ label: "문자 보내기" }],
    type: "alert" as const,
  },
  {
    title: "인건비 경고",
    mockupMessage: "⚠️ 인건비 비율 경고\n\n인건비 38% (업종 평균 25%)\n조정 시 월 +95만원\n시뮬레이션 해볼까요?",
    buttons: [{ label: "시뮬레이션 보기" }],
    type: "alert" as const,
  },
];

export function InsightShowcaseSection() {
  return (
    <section
      id="insight-showcase"
      className="bg-[#F8FAFC] px-4 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-5xl">
        {/* Title */}
        <div className="mb-10 text-center">
          <h2 className="break-keep text-2xl font-bold text-[#1E293B] md:text-3xl">
            점장이 이런 것까지 알려줘요
          </h2>
          <p className="mt-2 break-keep text-base text-[#64748B]">
            실제 카카오톡으로 받는 알림이에요
          </p>
        </div>

        {/* Mobile: horizontal scroll / Desktop: 2x2 grid */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4 lg:gap-6">
          {insights.map((item, i) => (
            <div
              key={i}
              className="w-64 flex-shrink-0 md:w-auto md:flex-shrink"
            >
              {/* Category label */}
              <p className="mb-2 text-center text-xs font-semibold text-[#64748B]">
                {item.title}
              </p>
              <KakaoMockup
                message={item.mockupMessage}
                buttons={item.buttons}
                type={item.type}
                time="방금"
              />
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-10 text-center text-sm font-medium text-[#64748B]">
          ... 외{" "}
          <span className="font-bold text-[#1E40AF]">25가지</span> 인사이트를
          자동으로 감지해요
        </p>
      </div>
    </section>
  );
}
