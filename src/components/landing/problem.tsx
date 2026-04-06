// S2 Problem — "사장님, 혹시 이런 거 겪고 계시죠?"

import { Frown, Clock, TrendingDown, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { AnimateOnScroll } from "./animate-on-scroll";

const problems: { icon: ReactNode; text: string }[] = [
  {
    icon: <Frown className="h-8 w-8 text-orange-500" />,
    text: "배민 열어서 매출 확인하고 엑셀에 옮기고...",
  },
  {
    icon: <Clock className="h-8 w-8 text-red-500" />,
    text: "리뷰 답글 하나하나 쓸 시간이 없어...",
  },
  {
    icon: <TrendingDown className="h-8 w-8 text-red-500" />,
    text: "매출이 왜 떨어졌는지 모르겠어...",
  },
  {
    icon: <HelpCircle className="h-8 w-8 text-amber-500" />,
    text: "비용이 어디서 새는지 모르겠어...",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white px-4 py-16 md:px-8 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {/* Title */}
        <h2 className="break-keep text-center text-2xl font-bold text-slate-800 md:text-3xl">
          사장님, 혹시 이런 거 겪고 계시죠?
        </h2>

        {/* 2x2 grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {problems.map((item, i) => (
            <AnimateOnScroll key={i} delay={i * 100}>
              <div
                className="rounded-2xl border border-gray-100 bg-slate-50 p-6 text-center"
              >
                <div className="mb-3 flex justify-center">{item.icon}</div>
                <p className="break-keep text-sm leading-relaxed text-slate-800 md:text-base">
                  {item.text}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        {/* Bottom quote */}
        <p className="mt-10 break-keep text-center text-base font-medium text-slate-500 md:text-lg">
          바쁜 사장님 대신, 알아서 챙기는 AI 점장이 필요해요.
        </p>
      </div>
    </section>
  );
}
