import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-[#2563EB] hover:underline">
        &larr; 홈으로 돌아가기
      </Link>
      <h1 className="text-2xl font-bold mt-6 mb-6">환불정책</h1>

      <div className="space-y-6 text-sm text-[#374151] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            1. 환불 가능 조건
          </h2>
          <table className="w-full border-collapse border border-[#E5E7EB] text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="border border-[#E5E7EB] px-4 py-2 text-left">조건</th>
                <th className="border border-[#E5E7EB] px-4 py-2 text-left">환불 가능 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#E5E7EB] px-4 py-2">구독 후 7일 이내 + 미사용</td>
                <td className="border border-[#E5E7EB] px-4 py-2">전액 환불</td>
              </tr>
              <tr>
                <td className="border border-[#E5E7EB] px-4 py-2">구독 후 7일 초과</td>
                <td className="border border-[#E5E7EB] px-4 py-2">환불 불가</td>
              </tr>
              <tr>
                <td className="border border-[#E5E7EB] px-4 py-2">무료 체험 기간 중</td>
                <td className="border border-[#E5E7EB] px-4 py-2">해당 없음 (무료)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            2. 환불 반영 시점
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>신용카드: 2~5 영업일</li>
            <li>체크카드/계좌이체: 즉시~1 영업일</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            3. 환불 신청 방법
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>전화: 010-2093-9980</li>
            <li>이메일: purrpurr.ai@gmail.com</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            4. 구독 해지
          </h2>
          <p>
            구독은 설정 페이지에서 언제든 해지할 수 있으며, 해지 후에도 현재
            결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
