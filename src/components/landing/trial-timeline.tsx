"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const timelineItems = [
  {
    day: "D+1",
    emoji: "☀️",
    title: "첫 리포트",
    desc: "어제 매출 + 미답변 리뷰 알림",
    reaction: '"오 이게 되네"',
    accent: false,
  },
  {
    day: "D+2",
    emoji: "🔍",
    title: "첫 인사이트",
    desc: '"배달 느림 리뷰 2건, 답글 달까요?"',
    reaction: '"AI가 분석을 해주네"',
    accent: false,
  },
  {
    day: "D+3",
    emoji: "📊",
    title: "재무 분석",
    desc: "이번 주 매출 전주 대비 분석",
    reaction: '"몰랐던 걸 알려주네"',
    accent: false,
  },
  {
    day: "D+5",
    emoji: "👤",
    title: "마케팅",
    desc: '"단골 3명이 2주째 안 왔어요"',
    reaction: '"못 챙긴 걸 챙겨줌"',
    accent: false,
  },
  {
    day: "D+6",
    emoji: "🏆",
    title: "1주 성적표",
    desc: "종합 리포트 + 점장 성과 요약",
    reaction: '"이 정도면 쓸 만한데"',
    accent: true,
  },
  {
    day: "D+7",
    emoji: "⏰",
    title: "계약 종료",
    desc: '"오늘 자정에 점장이 퇴근해요"',
    reaction: null,
    accent: true,
    cta: true,
  },
];

export function TrialTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="trial"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {/* Heading */}
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 [word-break:keep-all] sm:text-3xl">
            7일 동안 이런 경험을 하게 돼요
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative mt-12 pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 h-full w-0.5 bg-slate-200" />

          <div className="space-y-8">
            {timelineItems.map((item, i) => (
              <div
                key={item.day}
                className="relative transition-all duration-700"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: `${200 + i * 120}ms`,
                }}
              >
                {/* Circle node */}
                <div
                  className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white text-xs font-bold"
                  style={{
                    borderColor: item.accent ? "#F59E0B" : "#1E40AF",
                    color: item.accent ? "#F59E0B" : "#1E40AF",
                  }}
                >
                  {i + 1}
                </div>

                {/* Content */}
                <div
                  className="rounded-xl border p-4 transition-colors"
                  style={{
                    borderColor: item.accent ? "#FDE68A" : "#E2E8F0",
                    backgroundColor: item.accent ? "#FFFBEB" : "#F8FAFC",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: item.accent ? "#B45309" : "#1E40AF" }}
                    >
                      {item.day}
                    </span>
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500 [word-break:keep-all]">
                    {item.desc}
                  </p>

                  {item.reaction && (
                    <p
                      className="mt-1 text-xs font-medium"
                      style={{ color: item.accent ? "#B45309" : "#1E40AF" }}
                    >
                      {item.reaction}
                    </p>
                  )}

                  {item.cta && (
                    <Link href="/auth/signup" className="mt-3 block">
                      <button
                        className="h-10 w-full rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#F59E0B" }}
                      >
                        점장 계속 고용하기 →
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-10 text-center transition-all duration-700 delay-[1000ms]"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <Link href="/auth/signup" className="inline-block">
            <button
              className="h-14 rounded-xl bg-blue-800 px-8 text-base font-bold text-white shadow-lg transition-opacity hover:bg-blue-900"
            >
              지금 체험 시작하기 →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
