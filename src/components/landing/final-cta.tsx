import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTASection() {
  return (
    <section
      id="cta-final"
      className="py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(135deg, var(--landing-primary) 0%, var(--landing-primary-dark) 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          답장이, 세리, 바이럴
          <br className="sm:hidden" /> AI 팀을 만나보세요
        </h2>
        <p className="mt-4 text-sm text-white/80 sm:text-base">
          가입 후 바로 사용할 수 있어요. 카드 등록 없이 AI 팀이 바로 일합니다.
        </p>
        <div className="mt-8">
          <a href="/auth/login">
            <Button
              size="lg"
              className="rounded-full bg-white px-8 text-base font-semibold shadow-lg transition-colors hover:bg-white/90"
              style={{ color: "var(--landing-primary-dark)" }}
            >
              무료 체험 시작하기
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
