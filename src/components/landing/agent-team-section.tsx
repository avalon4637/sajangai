"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound, MessageSquare, BarChart3, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const agents: {
  icon: LucideIcon;
  name: string;
  tagline: string;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
}[] = [
  {
    icon: UserRound,
    name: "점장",
    tagline: "총괄 매니저",
    features: ["전체 조율", "리포트 발송", "이상 알림"],
    color: "#1E40AF",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    iconBg: "#DBEAFE",
  },
  {
    icon: MessageSquare,
    name: "답장이",
    tagline: "리뷰 매니저",
    features: ["리뷰 관리", "AI 답글", "감성 분석"],
    color: "#B45309",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
    iconBg: "#FEF3C7",
  },
  {
    icon: BarChart3,
    name: "세리",
    tagline: "매출 분석가",
    features: ["매출 분석", "비용 감시", "시뮬레이션"],
    color: "#065F46",
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    iconBg: "#D1FAE5",
  },
  {
    icon: Megaphone,
    name: "바이럴",
    tagline: "마케터",
    features: ["단골 관리", "문자 발송", "프로모션"],
    color: "#6B21A8",
    bgColor: "#FAF5FF",
    borderColor: "#DDD6FE",
    iconBg: "#EDE9FE",
  },
];

export function AgentTeamSection() {
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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ai-team"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Heading */}
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 [word-break:keep-all] sm:text-3xl">
            사장님을 위한 AI 직원 4명
          </h2>
        </div>

        {/* 2x2 Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map((agent, i) => (
            <div
              key={agent.name}
              className="rounded-2xl border p-5 transition-all duration-700"
              style={{
                backgroundColor: agent.bgColor,
                borderColor: agent.borderColor,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${150 + i * 100}ms`,
              }}
            >
              {/* Icon + name */}
              <div className="flex items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: agent.iconBg }}
                >
                  <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                </div>
                <div>
                  <p
                    className="text-base font-bold"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </p>
                  <p className="text-xs text-slate-500">{agent.tagline}</p>
                </div>
              </div>

              {/* Features */}
              <ul className="mt-3 space-y-1.5">
                {agent.features.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-1.5 text-sm text-slate-800"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <p
          className="mt-8 text-center text-base font-medium text-slate-500 [word-break:keep-all] transition-all duration-700 delay-500"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          4명이 24시간 사장님 매장을 지켜요.
        </p>
      </div>
    </section>
  );
}
