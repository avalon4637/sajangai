import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { HeroSection } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem";
import { SolutionSection } from "@/components/landing/solution";
import { FeaturesSection } from "@/components/landing/features";
import { ComparisonSection } from "@/components/landing/comparison";
import { TrustSection } from "@/components/landing/trust";
import { FAQSection } from "@/components/landing/faq";
import { FinalCTASection } from "@/components/landing/final-cta";
import { AITeamSection } from "@/components/landing/ai-team";
import { RevenuePreviewSection } from "@/components/landing/revenue-preview";
import { LandingFooter } from "@/components/landing/footer";
import { MobileCTA } from "@/components/landing/mobile-cta";

export const metadata: Metadata = {
  title: "사장 AI - AI 매장 운영 파트너",
  description:
    "답장이, 세리, 바이럴 - 3명의 AI 팀이 리뷰 답변, 매출 분석, 마케팅까지 대신 챙겨드립니다.",
  openGraph: {
    title: "사장 AI - AI 매장 운영 파트너",
    description:
      "답장이, 세리, 바이럴 - 3명의 AI 팀이 리뷰 답변, 매출 분석, 마케팅까지 대신 챙겨드립니다.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="landing min-h-screen">
      <LandingNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <AITeamSection />
        <FeaturesSection />
        <RevenuePreviewSection />
        <ComparisonSection />
        <TrustSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
      <MobileCTA />
    </div>
  );
}
