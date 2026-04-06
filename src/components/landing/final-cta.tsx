import Link from "next/link";

export function FinalCTASection() {
  return (
    <section
      id="cta-final"
      className="py-16 sm:py-20 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500"
    >
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold leading-snug text-white [word-break:keep-all] sm:text-3xl">
          바쁜 사장님 대신
          <br />
          알아서 챙기는 AI 점장,
          <br />
          지금 만나보세요.
        </h2>

        <Link href="/auth/signup" className="mt-8 block">
          <button className="mx-auto h-14 w-full max-w-xs rounded-xl bg-white text-base font-bold text-blue-800 shadow-lg transition-opacity hover:opacity-90">
            7일 무료 체험 시작하기 →
          </button>
        </Link>

        <p className="mt-3 text-sm text-blue-200">
          하루 990원 · 카드 등록 없음
        </p>
      </div>
    </section>
  );
}
