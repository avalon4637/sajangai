import { Clock, PenLine, TrendingDown } from "lucide-react";

const problems = [
  {
    icon: Clock,
    text: "바빠서 리뷰 답변을 미루다 보면 어느새 10개 넘게 쌓여있다",
  },
  {
    icon: PenLine,
    text: "하나하나 직접 쓰자니 시간이 너무 걸린다",
  },
  {
    icon: TrendingDown,
    text: "답변 없는 리뷰가 많으면 매장 평점에도 영향이 간다",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          이런 경험, 있으시죠?
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-8">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50/70 p-8 text-center transition-all hover:border-gray-200 hover:shadow-md"
              >
                <div
                  className="mb-5 flex size-14 items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: "oklch(0.95 0.02 250)" }}
                >
                  <Icon
                    className="size-7"
                    style={{ color: "var(--landing-primary)" }}
                  />
                </div>
                <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
