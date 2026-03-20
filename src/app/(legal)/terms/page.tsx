import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-[#2563EB] hover:underline">
        &larr; 홈으로 돌아가기
      </Link>
      <h1 className="text-2xl font-bold mt-6 mb-4">이용약관</h1>
      <p className="text-sm text-[#6B7280]">
        본 페이지는 준비 중입니다. 서비스 이용약관은 정식 출시 전에 업데이트될 예정입니다.
      </p>
    </main>
  );
}
