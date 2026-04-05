import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KakaoMockup } from "@/components/landing/kakao-mockup";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="bg-gradient-to-br from-blue-50 to-white px-4 py-16 md:px-8 md:py-24 lg:px-16"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
        {/* Left: Hero Copy */}
        <div className="flex-1 text-center md:text-left">
          {/* Headline */}
          <h1 className="break-keep text-4xl font-bold leading-tight tracking-tight text-[#1E293B] md:text-5xl lg:text-6xl">
            하루 990원,
            <br />
            점장 한 명.
          </h1>

          {/* Sub */}
          <p className="mt-5 break-keep text-lg leading-relaxed text-[#64748B] md:text-xl">
            AI 점장이 매출·리뷰·비용을
            <br className="hidden sm:block" />
            매일 아침 카톡으로 챙겨드려요.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
            <Button
              asChild
              className="h-14 w-full rounded-xl bg-[#1E40AF] px-8 text-base font-semibold text-white hover:bg-[#1d3a9e] md:w-auto"
            >
              <Link href="/auth/signup">7일 무료 체험 시작하기 →</Link>
            </Button>
            <p className="text-sm text-[#64748B]">카드 등록 없이 바로 시작</p>
          </div>
        </div>

        {/* Right: KakaoTalk morning report mockup */}
        <div className="w-full max-w-sm flex-shrink-0 md:w-80">
          <KakaoMockup
            profileName="점장"
            profileEmoji="🧑‍💼"
            type="report"
            time="오전 8:07"
            message={`☀️ [사장님 매장] 아침 리포트\n\n📊 어제 매출: 487,000원 (+12%)\n⭐ 신규 리뷰 2건 (부정 1건)\n💡 배달 느림 리뷰 3건째 쌓이고 있어요`}
            buttons={[
              { label: "상세 보기" },
              { label: "답글 확인하기" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
