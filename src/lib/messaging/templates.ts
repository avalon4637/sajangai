// KakaoTalk AlimTalk template definitions
// Each template maps to a registered Kakao Business template
// Template IDs must match those registered in the Kakao Business channel
// Variables use #{variable_name} syntax per Kakao specification

import type { AlimTalkButton } from "./solapi-client";

export type TemplateId =
  | "DAILY_BRIEFING"
  | "URGENT_REVIEW"
  | "CASHFLOW_WARNING"
  | "WEEKLY_SUMMARY"
  | "INSIGHT_ALERT";

export interface TemplateConfig {
  templateId: string;
  description: string;
  variables: string[];
  buttons?: AlimTalkButton[];
}

/**
 * Template registry mapping logical names to Kakao template configurations.
 * templateId values correspond to templates registered in Kakao Business.
 * Use environment variables for template IDs to support dev/prod separation.
 */
export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  DAILY_BRIEFING: {
    templateId: process.env.KAKAO_TEMPLATE_DAILY_BRIEFING ?? "KA01TP_DAILY",
    description: "아침 일일 브리핑 - 전날 매출 요약 및 오늘 주의사항",
    variables: ["business_name", "summary", "revenue", "review_count", "alert"],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "대시보드 보기",
        linkMo: process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai",
        linkPc: process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai",
      },
    ],
  },

  URGENT_REVIEW: {
    templateId: process.env.KAKAO_TEMPLATE_URGENT_REVIEW ?? "KA01TP_REVIEW",
    description: "부정적 리뷰 긴급 알림 - 1-2점 리뷰 접수 즉시 발송",
    variables: ["business_name", "rating", "review_excerpt", "platform"],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "리뷰 확인하기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/reviews`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/reviews`,
      },
    ],
  },

  CASHFLOW_WARNING: {
    templateId:
      process.env.KAKAO_TEMPLATE_CASHFLOW_WARNING ?? "KA01TP_CASHFLOW",
    description: "자금 부족 경고 - 예상 잔액이 임계값 미만으로 떨어질 때",
    variables: [
      "business_name",
      "alert_date",
      "expected_balance",
      "threshold",
    ],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "자금 현황 보기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
      },
    ],
  },

  INSIGHT_ALERT: {
    templateId: process.env.KAKAO_TEMPLATE_INSIGHT ?? "KA01TP_INSIGHT",
    description: "AI 인사이트 알림 - 긴급/중요 인사이트 발견 시 발송",
    variables: ["business_name", "severity", "insight_title", "recommendation"],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "인사이트 확인하기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
      },
    ],
  },

  WEEKLY_SUMMARY: {
    templateId: process.env.KAKAO_TEMPLATE_WEEKLY_SUMMARY ?? "KA01TP_WEEKLY",
    description: "주간 성과 요약 - 매주 월요일 오전 발송",
    variables: [
      "business_name",
      "week_revenue",
      "week_profit",
      "review_avg",
      "highlight",
    ],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "주간 리포트 보기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
      },
    ],
  },
};

/**
 * Build Solapi-compatible variables map from template variable values.
 * Kakao uses #{variable_name} syntax; this wraps values for the API.
 */
export function buildVariables(
  templateId: TemplateId,
  values: Record<string, string>
): Record<string, string> {
  const config = TEMPLATES[templateId];
  const result: Record<string, string> = {};

  for (const varName of config.variables) {
    const value = values[varName];
    if (value !== undefined) {
      result[`#{${varName}}`] = value;
    }
  }

  return result;
}
