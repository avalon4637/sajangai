// S4 Features — "점장이 매일 하는 일"
// 3 feature cards with KakaoTalk-style mockups

import { KakaoMockup } from "@/components/landing/kakao-mockup";
import { AnimateOnScroll } from "./animate-on-scroll";

const featureItems = [
  {
    emoji: "☀️",
    number: "1",
    title: "매일 아침, 카톡으로 보고",
    desc: "배민·쿠팡·요기요·카드 매출을 자동으로 모아서 매일 아침 카톡으로 보내드려요.",
    mockupMessage: "☀️ [사장님 매장] 아침 리포트\n\n📊 어제 매출: 487,000원 (+12%)\n🛵 배민 245,000 / 쿠팡 182,000\n💳 카드 60,000",
    mockupButtons: [{ label: "상세 보기" }],
    mockupTime: "오전 8:00",
  },
  {
    emoji: "🔍",
    number: "2",
    title: "문제가 생기면 먼저 알려줘요",
    desc: "매출 하락, 리뷰 악화, 비용 급증... 원인까지 분석해서 알려드려요. 사장님이 발견하기 전에 점장이 먼저.",
    mockupMessage: "🚨 매출 하락 감지\n\n매출이 32% 줄었어요.\n리뷰 미답변 3건이 원인이에요.\nAI 답글 3건 준비했어요.",
    mockupButtons: [{ label: "답글 등록하기" }],
    mockupTime: "오후 2:15",
  },
  {
    emoji: "👆",
    number: "3",
    title: "버튼 하나면 해결",
    desc: "리뷰 답글 등록, 재방문 문자 발송, 프로모션 제작까지. 사장님은 확인만 하면 돼요.",
    mockupMessage: "💌 단골 고객 재방문 문자\n\n\"안녕하세요, 사장님이에요!\n이번 주 방문 고객 할인 이벤트,\n놓치지 마세요 🎉\"",
    mockupButtons: [{ label: "문자 발송하기" }],
    mockupTime: "오후 4:30",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white px-4 py-16 md:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Title */}
        <h2 className="break-keep text-center text-2xl font-bold text-slate-800 md:text-3xl">
          점장이 매일 하는 일
        </h2>

        {/* Feature cards */}
        <div className="mt-10 flex flex-col gap-8 md:gap-12">
          {featureItems.map((item, i) => (
            <AnimateOnScroll key={i} delay={i * 150}>
            <div
              className={`flex flex-col items-center gap-6 rounded-2xl border border-gray-100 bg-slate-50 p-6 md:flex-row md:gap-10 md:p-8 ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Text side */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-3 inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {item.number}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    기능 {item.number}
                  </span>
                </div>
                <h3 className="break-keep text-xl font-bold text-slate-800">
                  {item.title}
                </h3>
                <p className="mt-3 break-keep text-sm leading-relaxed text-slate-500 md:text-base">
                  {item.desc}
                </p>
              </div>

              {/* Mockup side */}
              <div className="w-full max-w-[260px] flex-shrink-0">
                <KakaoMockup
                  message={item.mockupMessage}
                  buttons={item.mockupButtons}
                  type="report"
                  time={item.mockupTime}
                  size="small"
                />
              </div>
            </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
