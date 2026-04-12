import Link from "next/link";

export const metadata = {
  title: "이용약관 | 사장AI",
  description: "사장AI 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-[#2563EB] hover:underline">
        &larr; 홈으로 돌아가기
      </Link>
      <h1 className="mt-6 mb-2 text-2xl font-bold">이용약관</h1>
      <p className="mb-8 text-xs text-amber-700">
        ※ 본 약관은 베타 기간 동안 적용되는 초안이에요. 정식 출시 전 법률 검토를
        거쳐 변경될 수 있어요.
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제1조 (목적)
          </h2>
          <p>
            본 약관은 사장AI(이하 &quot;회사&quot;)가 제공하는 AI 기반 매장 운영
            보조 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와
            이용자의 권리, 의무 및 책임사항을 정함을 목적으로 해요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제2조 (정의)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>&quot;서비스&quot;란 회사가 제공하는 AI 점장 플랫폼을 말해요.</li>
            <li>
              &quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 회원을
              말해요.
            </li>
            <li>
              &quot;AI 에이전트&quot;란 회사가 제공하는 점장·세리·답장이·바이럴
              등 인공지능 기반 자동화 도우미를 말해요.
            </li>
            <li>
              &quot;구독&quot;이란 이용자가 유료 플랜을 선택해 회사에 이용료를
              지급하고 서비스를 이용하는 것을 말해요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제3조 (약관의 효력 및 변경)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              본 약관은 서비스 화면에 게시함으로써 효력이 발생해요.
            </li>
            <li>
              회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있어요.
              개정 시 시행일 7일 전부터 공지하고, 이용자에게 불리한 개정은 30일
              전에 공지해요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제4조 (서비스의 내용)
          </h2>
          <p className="mb-2">회사는 다음 서비스를 제공해요.</p>
          <ul className="list-inside list-disc space-y-1">
            <li>매출·지출·고정비 데이터 관리 및 분석</li>
            <li>AI 기반 리뷰 답글 초안 생성</li>
            <li>매장 운영 인사이트 및 제안</li>
            <li>카카오톡 기반 일일 브리핑 (베타)</li>
            <li>기타 회사가 추가로 제공하는 부가 서비스</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제5조 (이용 계약의 성립)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              이용 계약은 이용자가 약관 동의 후 회원가입을 완료한 시점에
              성립해요.
            </li>
            <li>
              회사는 다음 경우 가입을 제한할 수 있어요: 타인의 정보 도용, 허위
              정보 기재, 기타 관련 법령 위반 소지가 있는 경우.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제6조 (이용료 및 결제)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>무료 체험: 7일간 제한된 기능으로 무료 이용할 수 있어요.</li>
            <li>
              유료 플랜: 월 29,700원(VAT 별도). 결제는 PortOne을 통해
              처리되며, 카드 정보는 회사가 직접 보관하지 않아요.
            </li>
            <li>
              자동 갱신: 별도 해지 신청이 없는 한 매월 자동 갱신돼요. 해지는
              서비스 내 설정 페이지에서 언제든 가능해요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제7조 (청약 철회 및 환불)
          </h2>
          <p>
            환불 정책은{" "}
            <Link
              href="/refund-policy"
              className="text-[#2563EB] hover:underline"
            >
              환불 정책 페이지
            </Link>
            를 참고해 주세요.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제8조 (이용자의 의무)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              이용자는 서비스 이용 과정에서 관련 법령, 약관, 공지사항 등을
              준수해야 해요.
            </li>
            <li>
              이용자는 회사의 사전 동의 없이 서비스를 영리 목적으로 복제, 배포,
              2차 가공해서는 안 돼요.
            </li>
            <li>
              이용자가 서비스에 입력한 데이터의 정확성에 대한 책임은
              이용자에게 있어요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제9조 (회사의 의무)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              회사는 안정적인 서비스 제공을 위해 최선을 다하되, 불가항력적인
              사유로 서비스가 중단될 수 있어요.
            </li>
            <li>
              회사는 이용자의 개인정보를{" "}
              <Link
                href="/privacy"
                className="text-[#2563EB] hover:underline"
              >
                개인정보처리방침
              </Link>
              에 따라 보호해요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제10조 (AI 생성물의 한계)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              서비스가 제공하는 AI 분석, 리뷰 답글, 인사이트, 제안은
              &quot;참고 자료&quot;이며 경영 의사결정의 최종 책임은 이용자에게
              있어요.
            </li>
            <li>
              회사는 AI 생성물의 정확성·완전성·적합성을 보증하지 않아요.
            </li>
            <li>
              이용자가 AI 생성물을 그대로 외부에 사용한 결과로 발생한 손해에
              대해 회사는 책임지지 않아요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제11조 (면책 조항)
          </h2>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력
              사유로 인한 서비스 중단에 대해 책임지지 않아요.
            </li>
            <li>
              회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지
              않아요.
            </li>
            <li>
              회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에
              대해 책임지지 않아요.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-900">
            제12조 (분쟁 해결)
          </h2>
          <p>
            본 약관에 관한 분쟁은 대한민국 법률에 따르며, 회사 본점 소재지를
            관할하는 법원을 1심 관할 법원으로 해요.
          </p>
        </section>

        <section className="border-t pt-6 text-xs text-slate-500">
          <p>부칙</p>
          <p className="mt-1">본 약관은 2026년 4월 11일부터 적용돼요.</p>
          <p className="mt-1">문의: purrpurr.ai@gmail.com / 010-2093-9980</p>
        </section>
      </div>
    </main>
  );
}
