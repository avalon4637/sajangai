import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 | 사장AI",
  description: "사장AI 개인정보 수집·이용 및 처리에 관한 방침",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[#2563EB] hover:underline">
        &larr; 홈으로 돌아가기
      </Link>
      <h1 className="mt-6 mb-2 text-2xl font-bold">개인정보처리방침</h1>
      <p className="mb-8 text-xs text-amber-700">
        ※ 본 방침은 베타 기간 동안 적용되는 초안이에요. 정식 출시 전 법률 검토를
        거쳐 변경될 수 있어요. 변경 시 서비스 내 공지 및 이메일로 안내해 드려요.
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            1. 개인정보 수집 항목
          </h2>
          <p className="mb-3">
            사장AI는 서비스 제공을 위해 다음 개인정보를 수집해요.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-600">
              필수 항목
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>이메일 주소 (로그인 ID)</li>
              <li>비밀번호 (암호화 저장)</li>
              <li>사업자등록번호 및 상호 (매장 등록 시)</li>
              <li>전화번호 (알림톡 수신용)</li>
              <li>매출·지출·리뷰 등 사업장 운영 데이터 (이용자 직접 입력 또는 연동)</li>
            </ul>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-600">
              선택 항목
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>카카오 소셜 로그인 정보 (프로필, 이메일)</li>
              <li>배달앱/카드사 연동 인증 정보 (암호화 저장)</li>
            </ul>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-xs font-semibold text-slate-600">
              자동 수집 항목
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>접속 로그, IP 주소, 쿠키, 브라우저/OS 정보</li>
              <li>서비스 이용 기록 (대시보드 조회, 기능 사용 이력)</li>
            </ul>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            ※ 결제 정보(카드번호 등)는 사장AI가 직접 보관하지 않고 결제 대행사
            PortOne의 토큰화 방식으로 처리돼요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            2. 개인정보 수집·이용 목적
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>회원 식별, 로그인, 본인 확인</li>
            <li>AI 분석 결과 및 경영 인사이트 제공</li>
            <li>카카오 알림톡 기반 일일 브리핑 발송</li>
            <li>결제 및 환불 처리</li>
            <li>고객 문의 응대 및 공지사항 전달</li>
            <li>서비스 품질 개선 및 장애 대응</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            3. 개인정보 보유 및 이용 기간
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>
              회원 정보: 회원 탈퇴 시까지. 탈퇴 후 14일 이내 파기 (단,
              부정이용 방지를 위해 해당 기간 내 재가입 제한)
            </li>
            <li>사업장 데이터: 회원 탈퇴 또는 사업장 삭제 시까지</li>
            <li>결제 기록: 전자상거래법에 따라 5년</li>
            <li>소비자 불만/분쟁 처리 기록: 3년</li>
            <li>접속 로그: 통신비밀보호법에 따라 3개월</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            4. 개인정보 제3자 제공
          </h2>
          <p>
            회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않아요.
            다만, 다음 경우 예외로 해요.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>이용자가 사전에 동의한 경우</li>
            <li>
              법령의 규정에 따르거나 수사 목적으로 수사기관이 절차에 따라
              요구하는 경우
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            5. 개인정보 처리 위탁
          </h2>
          <p className="mb-3">
            회사는 서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁하고
            있어요.
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">수탁업체</th>
                  <th className="px-3 py-2 text-left">위탁 업무</th>
                  <th className="px-3 py-2 text-left">처리 위치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2">Supabase Inc.</td>
                  <td className="px-3 py-2">회원·데이터 저장 (DB)</td>
                  <td className="px-3 py-2">AWS ap-northeast-2 (서울)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Vercel Inc.</td>
                  <td className="px-3 py-2">웹 호스팅 및 서버리스 실행</td>
                  <td className="px-3 py-2">Global Edge Network</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Anthropic PBC</td>
                  <td className="px-3 py-2">AI 분석 및 응답 생성 (Claude API)</td>
                  <td className="px-3 py-2">미국</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">PortOne</td>
                  <td className="px-3 py-2">결제 처리 및 카드 토큰화</td>
                  <td className="px-3 py-2">대한민국</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">SolAPI</td>
                  <td className="px-3 py-2">카카오 알림톡·SMS 발송</td>
                  <td className="px-3 py-2">대한민국</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            ※ Claude API에 전송되는 데이터는 Anthropic의 Enterprise 정책에
            따라 모델 학습에 사용되지 않아요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            6. 이용자의 권리와 행사 방법
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>언제든지 본인의 개인정보 조회, 수정, 삭제를 요청할 수 있어요.</li>
            <li>개인정보 처리 정지를 요청할 수 있어요.</li>
            <li>
              설정 페이지 또는 이메일(purrpurr.ai@gmail.com)을 통해 요청 가능해요.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            7. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>비밀번호는 단방향 해시 함수로 암호화 저장</li>
            <li>배달앱/카드 연동 정보는 AES-256으로 암호화 저장</li>
            <li>전송 구간 HTTPS(TLS 1.3) 강제</li>
            <li>데이터베이스 접근은 Row Level Security(RLS)로 제한</li>
            <li>결제 정보는 PortOne 토큰화 처리(PCI-DSS 준수)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            8. 쿠키 사용
          </h2>
          <p>
            회사는 로그인 상태 유지, 사업장 선택 기억 등을 위해 쿠키를
            사용해요. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수
            있으나, 이 경우 서비스 이용에 제한이 있을 수 있어요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            9. 개인정보 보호책임자
          </h2>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p>개인정보 보호책임자</p>
            <p>이메일: purrpurr.ai@gmail.com</p>
            <p>전화: 010-2093-9980</p>
          </div>
        </section>

        <section className="border-t pt-6 text-xs text-slate-500">
          <p>부칙</p>
          <p className="mt-1">본 방침은 2026년 4월 11일부터 적용돼요.</p>
        </section>
      </div>
    </main>
  );
}
