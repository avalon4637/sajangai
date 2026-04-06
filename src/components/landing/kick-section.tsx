// S3 Kick — "체중계 vs 주치의"
// Visual contrast between data-only services and sajang.ai

import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "./animate-on-scroll";

export function KickSection() {
  return (
    <section
      id="kick"
      className="bg-[#F8FAFC] px-4 py-16 md:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="break-keep text-2xl font-bold text-[#1E293B] md:text-3xl">
            다른 서비스는 숫자만 보여줘요.
          </h2>
          <p className="mt-2 break-keep text-base text-[#64748B] md:text-lg">
            점장은 원인을 찾고, 해결까지 해요.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* ❌ Other services */}
          <AnimateOnScroll delay={0}>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 opacity-70">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">❌</span>
              <span className="text-sm font-semibold text-[#64748B]">
                다른 서비스 (체중계)
              </span>
            </div>
            <p className="break-keep text-sm leading-relaxed text-[#64748B] md:text-base">
              &quot;어제 매출 312,000원입니다.&quot;
            </p>
            <p className="mt-2 text-xs text-gray-400">...끝.</p>
          </div>
          </AnimateOnScroll>

          {/* Arrow */}
          <div className="text-center text-2xl text-[#1E40AF]">↓</div>

          {/* ✅ sajang.ai */}
          <AnimateOnScroll delay={200}>
          <div className="rounded-2xl border-2 border-[#1E40AF] bg-white p-6 shadow-md">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">✅</span>
              <span className="text-sm font-semibold text-[#1E40AF]">
                sajang.ai (주치의)
              </span>
            </div>
            <div className="mb-4 space-y-1.5 text-sm leading-relaxed text-[#1E293B] md:text-base">
              <p className="break-keep">
                &quot;매출이{" "}
                <span className="font-bold text-[#EF4444]">32%</span>{" "}
                떨어졌어요.
              </p>
              <p className="break-keep">
                원인은 리뷰 미답변{" "}
                <span className="font-bold text-[#EF4444]">3건</span>이에요.
              </p>
              <p className="break-keep">지난달에도 같은 패턴이었어요.</p>
              <p className="break-keep">AI 답글 3건 준비했어요.&quot;</p>
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl border-[#1E40AF] text-sm font-semibold text-[#1E40AF] hover:bg-blue-50"
            >
              답글 등록하기
            </Button>
          </div>
          </AnimateOnScroll>
        </div>

        {/* Bottom tagline */}
        <p className="mt-10 break-keep text-center text-sm text-[#64748B] md:text-base">
          숫자만 보여주는 체중계가 아니라,
          <br className="hidden sm:block" />
          원인 진단 + 처방 + 약 타주는 주치의.
        </p>
      </div>
    </section>
  );
}
