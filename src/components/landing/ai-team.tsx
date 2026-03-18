import { MessageSquareText, BarChart3, Megaphone } from "lucide-react";

const agents = [
  {
    name: "답장이",
    role: "AI 리뷰 매니저",
    icon: MessageSquareText,
    color: "oklch(0.55 0.2 250)",
    bgColor: "oklch(0.95 0.03 250)",
    description: "리뷰 답변을 대신 챙겨주는 AI 점장",
    features: [
      "미응답 리뷰 자동 감지",
      "매장 톤에 맞는 AI 답변 생성",
      "카톡 알림 → 승인까지 30초",
    ],
  },
  {
    name: "세리",
    role: "AI 매출 분석가",
    icon: BarChart3,
    color: "oklch(0.45 0.18 160)",
    bgColor: "oklch(0.95 0.03 160)",
    description: "매출 데이터를 읽고 문제를 알려주는 분석가",
    features: [
      "플랫폼별 매출 트렌드 분석",
      "동네 매출 랭킹 비교",
      "매출 이상 징후 자동 감지",
    ],
  },
  {
    name: "바이럴",
    role: "AI 마케터",
    icon: Megaphone,
    color: "oklch(0.5 0.2 30)",
    bgColor: "oklch(0.95 0.03 30)",
    description: "매장 홍보와 마케팅 전략을 제안하는 AI",
    features: [
      "리뷰 기반 마케팅 인사이트",
      "경쟁 매장 분석 리포트",
      "SNS 콘텐츠 아이디어 제안",
    ],
    comingSoon: true,
  },
];

export function AITeamSection() {
  return (
    <section
      id="ai-team"
      className="py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(180deg, oklch(1 0 0) 0%, oklch(0.97 0.01 250 / 0.3) 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            당신의 매장을 위한 AI 팀
          </h2>
          <p className="mt-3 text-muted-foreground">
            각 분야 전문 AI가 사장님의 매장을 함께 운영합니다
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.name}
                className="relative rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-lg sm:p-8"
              >
                {agent.comingSoon && (
                  <span className="absolute right-4 top-4 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                    Coming Soon
                  </span>
                )}

                <div
                  className="flex size-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: agent.bgColor }}
                >
                  <Icon className="size-7" style={{ color: agent.color }} />
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold" style={{ color: agent.color }}>
                      {agent.name}
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground">
                      {agent.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {agent.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
