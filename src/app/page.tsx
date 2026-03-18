import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { HeroSection } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem";
import { SolutionSection } from "@/components/landing/solution";
import { ComparisonSection } from "@/components/landing/comparison";
import { FinalCTASection } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "사장 AI - AI 매장 운영 파트너",
  description:
    "리뷰·매출·마케팅, 4명의 AI 팀이 매장을 함께 운영합니다. 하루 330원으로 AI 점장을 고용하세요.",
  openGraph: {
    title: "사장 AI - AI 매장 운영 파트너",
    description:
      "리뷰·매출·마케팅, 4명의 AI 팀이 매장을 함께 운영합니다. 하루 330원으로 AI 점장을 고용하세요.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
      }}
    >
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <ComparisonSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
