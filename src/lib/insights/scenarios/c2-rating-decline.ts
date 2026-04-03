// C2: Rating decline trend
// Trigger: average rating drops 0.3+ over 3 weeks
import type { InsightResult, InsightScenario, ScenarioContext } from "../types";

export const c2RatingDecline: InsightScenario = {
  id: "C2",
  name: "평점 하락 추세",
  category: "review",
  async evaluate(ctx: ScenarioContext): Promise<InsightResult | null> {
    if (ctx.reviews.length < 10) return null;

    const now = new Date();
    const oneWeek = new Date(now.getTime() - 7 * 86_400_000);
    const threeWeeks = new Date(now.getTime() - 21 * 86_400_000);

    const recent = ctx.reviews.filter((r) => new Date(r.date) >= oneWeek);
    const older = ctx.reviews.filter(
      (r) => new Date(r.date) >= threeWeeks && new Date(r.date) < oneWeek
    );

    if (recent.length < 3 || older.length < 3) return null;

    const recentAvg = recent.reduce((s, r) => s + r.rating, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + r.rating, 0) / older.length;
    const drop = olderAvg - recentAvg;

    if (drop < 0.3) return null;

    const unreplied = recent.filter(
      (r) => r.replyStatus === "none" || r.replyStatus === "draft"
    ).length;

    return {
      scenarioId: "C2",
      category: "review",
      severity: drop >= 0.5 ? "warning" : "info",
      detection: {
        title: `평점이 3주간 ${drop.toFixed(1)}점 하락했어요`,
        metric: `-${drop.toFixed(1)}점`,
        comparedTo: "3주 전",
      },
      cause: {
        summary: `평균 평점 ${olderAvg.toFixed(1)} → ${recentAvg.toFixed(1)}`,
        signals: [
          `최근 리뷰 ${recent.length}건 (평균 ${recentAvg.toFixed(1)}점)`,
          unreplied > 0 ? `미답변 ${unreplied}건` : "답글 모두 완료",
        ],
        confidence: 0.7,
      },
      solution: {
        recommendation: unreplied > 0
          ? `미답변 리뷰 ${unreplied}건에 답글을 등록하고 리뷰 요청 문자를 보내세요`
          : "리뷰 요청 문자로 긍정 리뷰를 늘려보세요",
        expectedEffect: "답글 등록 시 평점 회복에 평균 2~3주 소요",
      },
      action: unreplied > 0
        ? { type: "reply_reviews", label: "답글 등록하기", payload: { unrepliedCount: unreplied } }
        : { type: "send_message", label: "리뷰 요청 보내기", payload: {} },
    };
  },
};
