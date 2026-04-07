"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "배민/쿠팡 계정 정보 안전한가요?",
    a: "하이픈(금융보안 인증 업체)이 암호화해서 저장해요. 사장AI는 비밀번호를 직접 보관하지 않아요.",
  },
  {
    q: "매일 아침 카톡이 귀찮지 않을까요?",
    a: "사장님이 원하는 시간에, 원하는 스타일로 보내드려요. 설정에서 언제든 조정 가능해요.",
  },
  {
    q: "AI가 리뷰 답글을 잘 써주나요?",
    a: "사장님 매장 톤에 맞춰 작성하고, 등록 전에 항상 확인할 수 있어요. 마음에 안 들면 수정도 돼요.",
  },
  {
    q: "7일 체험 후 자동 결제되나요?",
    a: "아니요. 체험이 끝나면 자동으로 종료돼요. 사장님이 직접 고용 결정을 하셔야 해요.",
  },
  {
    q: "배달 안 하고 카드매출만 있어도 되나요?",
    a: "네. 카드매출만 연결해도 매출 분석, 비용 경고, 시뮬레이션 모두 사용 가능해요.",
  },
  {
    q: "ROI 보고서 숫자, 진짜인가요?",
    a: "보수적 기준으로 계산해요. 과장 없이 실제 데이터 근거로만 산출하고, 계산 방법도 투명하게 공개해요.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          자주 묻는 질문
        </h2>

        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-slate-200"
            >
              <AccordionTrigger className="py-5 text-left text-base font-semibold text-slate-800 hover:no-underline [word-break:keep-all]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-slate-500 [word-break:keep-all]">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
