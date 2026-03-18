import { MessageCircle, FileCheck, CheckCircle, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    title: "카톡으로 알림",
    desc: "답장이가 미응답 리뷰를 감지하면 카카오톡으로 바로 알려드려요",
    num: "1",
  },
  {
    icon: FileCheck,
    title: "AI 답변 확인",
    desc: "링크를 누르면 답장이가 만든 답변 초안을 바로 볼 수 있어요",
    num: "2",
  },
  {
    icon: CheckCircle,
    title: "승인하면 끝",
    desc: "마음에 들면 승인, 수정이 필요하면 고쳐서 등록하세요",
    num: "3",
  },
  {
    icon: BarChart3,
    title: "매출도 자동 분석",
    desc: "세리가 플랫폼별 매출을 분석하고 이상 징후를 알려드려요",
    num: "4",
  },
];

export function SolutionSection() {
  return (
    <section
      id="solution"
      className="py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.97 0.015 250) 0%, oklch(1 0 0) 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            사장 AI는 이렇게 해결합니다
          </h2>
          <p className="mt-3 text-muted-foreground">
            AI 팀이 먼저 일하고, 사장님은 확인만 하세요
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                {/* Connector arrow (desktop only, between items) */}
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-10 hidden translate-x-1/2 sm:block">
                    <ArrowRight
                      className="size-5 text-gray-300"
                    />
                  </div>
                )}

                {/* Step number */}
                <div
                  className="mb-4 flex size-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg"
                  style={{
                    backgroundColor: "var(--landing-primary)",
                  }}
                >
                  <Icon className="size-7" />
                </div>

                <span
                  className="mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--landing-primary)" }}
                >
                  Step {step.num}
                </span>
                <h3 className="text-lg font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
