"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "정말 무료인가요?",
    a: "네, 베타 기간 동안 모든 기능을 무료로 사용할 수 있습니다. 정식 출시 후에도 얼리버드 가입자에게 특별 혜택을 드립니다.",
  },
  {
    q: "어떤 리뷰 플랫폼을 지원하나요?",
    a: "네이버 플레이스, 카카오맵, 구글 리뷰를 지원합니다. 배달앱 리뷰도 곧 추가될 예정입니다.",
  },
  {
    q: "AI 답변이 이상하면 어떡하나요?",
    a: "AI가 만든 초안은 바로 등록되지 않습니다. 사장님이 직접 확인하고, 수정한 뒤 승인해야 등록됩니다.",
  },
  {
    q: "카카오톡 알림은 어떻게 받나요?",
    a: "가입 시 카카오톡 채널을 연결하면, 미응답 리뷰가 생길 때마다 자동으로 알림을 보내드립니다.",
  },
  {
    q: "기존 답변도 관리할 수 있나요?",
    a: "현재는 미응답 리뷰에 집중합니다. 추후 전체 리뷰 관리 기능도 추가할 예정입니다.",
  },
  {
    q: "매출 분석은 어떻게 하나요?",
    a: "세리가 네이버, 카카오맵, 구글 플랫폼의 매출 데이터를 자동으로 수집하고 분석합니다. 매출 트렌드, 동네 랭킹, 이상 징후 감지까지 모두 자동입니다.",
  },
  {
    q: "바이럴(마케팅 AI)은 언제 출시되나요?",
    a: "바이럴은 현재 개발 중이며, 베타 기간 중 순차적으로 공개할 예정입니다. 가입하시면 출시 시 알림을 드립니다.",
  },
];

export function FAQSection() {
  return (
    <section
      id="faq"
      className="bg-gradient-to-b from-white to-slate-50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          자주 묻는 질문
        </h2>

        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-gray-200">
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
