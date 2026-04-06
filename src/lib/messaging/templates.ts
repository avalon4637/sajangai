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
  | "INSIGHT_ALERT"
  | "MONTHLY_ROI"
  | "ANOMALY_ALERT"
  | "SUBSCRIPTION_STARTED"
  | "SUBSCRIPTION_EXPIRING"
  | "PAYMENT_FAILED";

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

  MONTHLY_ROI: {
    templateId: process.env.KAKAO_TEMPLATE_MONTHLY_ROI ?? "KA01TP_ROI",
    description: "월간 점장 성과 보고서 - 매월 1일 발송",
    variables: ["business_name", "month", "saved_money", "earned_money", "saved_hours", "roi_multiple"],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "성과 상세 보기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/billing`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/billing`,
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

  ANOMALY_ALERT: {
    templateId: process.env.KAKAO_TEMPLATE_ANOMALY ?? "KA01TP_ANOMALY",
    description: "이상 매출 감지 - 평소 대비 급등/급락 시 발송",
    variables: [
      "business_name",
      "anomaly_type",
      "metric_name",
      "current_value",
      "expected_value",
      "change_rate",
    ],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "상세 분석 보기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/dashboard`,
      },
    ],
  },

  SUBSCRIPTION_STARTED: {
    templateId:
      process.env.KAKAO_TEMPLATE_SUB_STARTED ?? "KA01TP_SUB_START",
    description: "구독 시작 안내 - 점장 고용 완료 시 발송",
    variables: ["business_name", "plan_name", "start_date", "next_billing_date"],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "대시보드 바로가기",
        linkMo: process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai",
        linkPc: process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai",
      },
    ],
  },

  SUBSCRIPTION_EXPIRING: {
    templateId:
      process.env.KAKAO_TEMPLATE_SUB_EXPIRING ?? "KA01TP_SUB_EXPIRE",
    description: "구독 만료 예정 안내 - 만료 3일 전 발송",
    variables: ["business_name", "plan_name", "expire_date", "days_remaining"],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "구독 연장하기",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/billing`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/billing`,
      },
    ],
  },

  PAYMENT_FAILED: {
    templateId: process.env.KAKAO_TEMPLATE_PAY_FAILED ?? "KA01TP_PAY_FAIL",
    description: "결제 실패 안내 - 자동 결제 실패 시 발송",
    variables: [
      "business_name",
      "plan_name",
      "fail_date",
      "fail_reason",
      "retry_date",
    ],
    buttons: [
      {
        buttonType: "WL",
        buttonName: "결제 수단 변경",
        linkMo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/billing`,
        linkPc: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://sajang.ai"}/billing`,
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
