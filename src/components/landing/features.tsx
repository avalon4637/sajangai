import {
  MessageSquareText,
  BarChart3,
  Megaphone,
  Sparkles,
  BellRing,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: MessageSquareText,
    title: "답장이 · 리뷰 자동 답변",
    desc: "미응답 리뷰를 감지하고 AI가 매장 톤에 맞는 답변 초안을 생성합니다",
    comingSoon: false,
  },
  {
    icon: BellRing,
    title: "답장이 · 카톡 알림",
    desc: "따로 앱을 열 필요 없이 카톡으로 바로 알려드려요",
    comingSoon: false,
  },
  {
    icon: BarChart3,
    title: "세리 · 매출 트렌드 분석",
    desc: "네이버, 카카오맵, 구글 매출을 한눈에 비교하고 이상 징후를 감지합니다",
    comingSoon: false,
  },
  {
    icon: TrendingUp,
    title: "세리 · 동네 매출 랭킹",
    desc: "우리 매장이 동네에서 몇 등인지, 경쟁 매장 대비 어떤지 확인하세요",
    comingSoon: false,
  },
  {
    icon: Megaphone,
    title: "바이럴 · 마케팅 인사이트",
    desc: "리뷰 데이터 기반 마케팅 전략과 SNS 콘텐츠 아이디어를 제안합니다",
    comingSoon: true,
  },
  {
    icon: Sparkles,
    title: "바이럴 · 경쟁 분석",
    desc: "주변 경쟁 매장 동향을 분석하고 차별화 포인트를 알려드려요",
    comingSoon: true,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          AI 팀이 해드리는 일
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          답장이, 세리, 바이럴이 각자 맡은 영역에서 일합니다
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="relative flex gap-4 rounded-2xl border border-gray-100 p-6 transition-all hover:border-gray-200 hover:shadow-md"
              >
                {feat.comingSoon && (
                  <span className="absolute right-3 top-3 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                    Coming Soon
                  </span>
                )}
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "oklch(0.95 0.02 250)" }}
                >
                  <Icon
                    className="size-5"
                    style={{ color: "var(--landing-primary)" }}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground sm:text-base">
                    {feat.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
