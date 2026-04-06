import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { HeroSection } from "@/components/landing/hero";
import { ProblemSection } from "@/components/landing/problem";
import { KickSection } from "@/components/landing/kick-section";
import { FeaturesSection } from "@/components/landing/features";
import { InsightShowcaseSection } from "@/components/landing/insight-showcase";
import { ROISection } from "@/components/landing/roi-section";
import { AgentTeamSection } from "@/components/landing/agent-team-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TrialTimeline } from "@/components/landing/trial-timeline";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTASection } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";
import { FloatingCTA } from "@/components/landing/floating-cta";
import { MidCTA } from "@/components/landing/mid-cta";
import { ProductPreview } from "@/components/landing/product-preview";
import { SocialProof } from "@/components/landing/social-proof";

export const metadata: Metadata = {
  title: "sajang.ai - 하루 990원, AI 점장이 매출 리뷰 비용을 챙겨드려요",
  description:
    "배민/쿠팡/요기요 매출 리뷰를 자동 분석하고, 문제가 생기면 먼저 알려주는 AI 경영 비서. 7일 무료 체험.",
  openGraph: {
    title: "sajang.ai - 하루 990원, AI 점장이 매출 리뷰 비용을 챙겨드려요",
    description:
      "배민/쿠팡/요기요 매출 리뷰를 자동 분석하고, 문제가 생기면 먼저 알려주는 AI 경영 비서. 7일 무료 체험.",
    type: "website",
  },
  keywords: [
    "소상공인 AI",
    "배달앱 매출 분석",
    "리뷰 자동 답글",
    "AI 점장",
    "매장 관리 AI",
    "소상공인 경영 분석",
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans">
      <LandingNav />
      <main>
        {/* M1: Hero + Problem + Kick (S1~S3) */}
        <HeroSection />
        <ProblemSection />
        <KickSection />

        {/* M2: Features + Product Preview + Insight Showcase (S4~S5) */}
        <FeaturesSection />
        <ProductPreview />
        <MidCTA />
        <InsightShowcaseSection />

        {/* M3: ROI + Agent Team + Pricing (S6~S8) */}
        <ROISection />
        <AgentTeamSection />
        <PricingSection />
        <SocialProof />

        {/* M4: Trial + FAQ + Final CTA (S9~S11) */}
        <TrialTimeline />
        <FAQSection />
        <FinalCTASection />
      </main>

      {/* S12: Footer */}
      <LandingFooter />

      {/* Mobile Floating CTA */}
      <FloatingCTA />
    </div>
  );
}
