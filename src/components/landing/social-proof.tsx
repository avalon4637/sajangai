"use client";

import { Shield, Lock, CalendarX } from "lucide-react";

const testimonials = [
  {
    name: "김** 사장님",
    business: "스크린골프장 · 부천",
    quote:
      "매일 아침 카톡으로 어제 매출이 오니까 배민 안 열어도 돼요. 리뷰 답글도 AI가 써주니 진짜 편해요.",
    metric: "리뷰 답글 시간 90% 절감",
  },
  {
    name: "박** 사장님",
    business: "카페 · 강남",
    quote:
      "수수료 최적화 알림 덕에 배달앱 비중을 조정했더니 월 8만원 절감됐어요. 혼자서는 절대 몰랐을 거예요.",
    metric: "월 8만원 비용 절감",
  },
  {
    name: "이** 사장님",
    business: "치킨집 · 수원",
    quote:
      "비용이 어디서 새는지 항상 궁금했는데, 세리가 매달 알려주니까 이제 감이 잡혀요.",
    metric: "비용 구조 가시화",
  },
];

const trustBadges = [
  { icon: Shield, label: "SSL 보안 적용" },
  { icon: Lock, label: "데이터 암호화" },
  { icon: CalendarX, label: "언제든 해지 가능" },
];

export function SocialProof() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          사장님들의 실제 후기
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          점장을 고용한 사장님들의 이야기
        </p>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.business}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="text-xs font-medium text-primary bg-primary/5 rounded-full px-3 py-1 inline-block">
                {t.metric}
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {trustBadges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <badge.icon className="w-4 h-4" />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
