"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Coins } from "lucide-react";

function useCountUp(target: number, duration: number, isActive: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }, [isActive, target, duration]);

  return count;
}

function MetricCard({
  label,
  value,
  unit,
  isActive,
}: {
  label: string;
  value: number;
  unit: string;
  isActive: boolean;
}) {
  const count = useCountUp(value, 1200, isActive);
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/20 px-4 py-3">
      <span className="text-sm font-medium text-blue-100">{label}</span>
      <span className="mt-1 text-3xl font-bold text-white">
        {unit === "h" ? count : count.toLocaleString()}
        <span className="text-lg">{unit}</span>
      </span>
    </div>
  );
}

export function ROISection() {
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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="roi"
      className="bg-slate-50 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Section heading */}
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 [word-break:keep-all] sm:text-3xl">
            점장이 벌어준 돈, 매달 알려드려요
          </h2>
        </div>

        {/* ROI Card */}
        <div
          className="mt-10 overflow-hidden rounded-2xl shadow-xl transition-all duration-700 delay-150"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          {/* Card header — gradient blue */}
          <div
            className="px-6 py-8 text-center bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500"
          >
            <p className="text-sm font-semibold tracking-wide text-blue-200">
              <Trophy className="inline h-4 w-4" /> 3월 점장 성과표
            </p>

            {/* 3 metrics */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MetricCard
                label="절약"
                value={47}
                unit="만원"
                isActive={isVisible}
              />
              <MetricCard
                label="수익"
                value={28}
                unit="만원"
                isActive={isVisible}
              />
              <MetricCard label="시간" value={6} unit="h" isActive={isVisible} />
            </div>

            {/* Cost vs value */}
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-blue-100">
              <span>점장 월급 29,700원</span>
              <span className="text-blue-300">→</span>
              <span>점장이 만든 가치 75만원</span>
            </div>

            {/* ROI multiplier */}
            <div className="mt-4">
              <span className="text-5xl font-bold text-amber-500">
                <Coins className="mb-1 inline h-10 w-10" /> 25배
              </span>
              <span className="ml-2 text-xl font-semibold text-amber-300">
                회수
              </span>
            </div>
          </div>

          {/* Card body — detail */}
          <div className="bg-white px-6 py-5">
            <ul className="space-y-3 text-sm text-slate-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">●</span>
                <span>
                  <strong>절약:</strong> 수수료 최적화, 비용 경고 대응으로
                  47만원 절감
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">●</span>
                <span>
                  <strong>수익:</strong> 단골 복귀 유도, 평점 관리 효과로
                  28만원 추가
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-800">●</span>
                <span>
                  <strong>시간:</strong> 리뷰 답글 38건, 리포트 30회 자동 처리
                </span>
              </li>
            </ul>

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              * 보수적 기준으로 계산해요. 과장 없이, 실제 데이터 근거로.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
