// Zod schemas for all AI engine structured outputs
// Replaces fragile text.match(/\{[\s\S]*\}/) regex parsing

import { z } from "zod/v4";

// ─── proactive-diagnosis.ts ──────────────────────────────────────────────────

/** Single diagnosis item returned by cross-agent proactive analysis */
export const DiagnosisItemSchema = z.object({
  type: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

/** Wrapper object Claude returns for the diagnosis endpoint */
export const DiagnosisSchema = z.object({
  diagnoses: z.array(DiagnosisItemSchema).default([]),
});

export type DiagnosisSchemaType = z.infer<typeof DiagnosisSchema>;

// ─── sentiment-analyzer.ts ───────────────────────────────────────────────────

const ReviewCategorySchema = z.enum(["맛", "양", "배달", "서비스", "가격", "위생", "기타"]);

/** Per-review sentiment result */
const SentimentResultItemSchema = z.object({
  id: z.string(),
  sentiment_score: z.number().min(-1).max(1),
  keywords: z.array(z.string()).default([]),
  category: ReviewCategorySchema.default("기타"),
});

/** Trend pattern aggregated from the batch */
const TrendPatternSchema = z.object({
  pattern: z.string(),
  count: z.number().int().nonnegative(),
  category: ReviewCategorySchema.default("기타"),
});

/** Full batch analysis response from Claude */
export const SentimentBatchSchema = z.object({
  results: z.array(SentimentResultItemSchema).default([]),
  trends: z.array(TrendPatternSchema).default([]),
});

export type SentimentBatchSchemaType = z.infer<typeof SentimentBatchSchema>;

// ─── brand-voice.ts ──────────────────────────────────────────────────────────

/** Voice traits extracted from owner's sample replies */
export const VoiceTraitsSchema = z.object({
  tone: z.enum(["formal", "friendly", "casual"]).default("friendly"),
  greetingStyle: z.string().default("안녕하세요! 저희 가게를 찾아주셔서 감사합니다."),
  closingStyle: z.string().default("다음에 또 방문해 주세요. 감사합니다!"),
  commonExpressions: z.array(z.string()).default([]),
  avoidExpressions: z.array(z.string()).default([]),
  personality: z.string().default("친절하고 따뜻한 소상공인 사장님"),
});

export type VoiceTraitsSchemaType = z.infer<typeof VoiceTraitsSchema>;

// ─── briefing-generator.ts ───────────────────────────────────────────────────

/** Structured fields extracted from the morning briefing narrative */
export const BriefingStructuredSchema = z.object({
  oneLiner: z.string(),
  revenue: z.number().default(0),
  reviewCount: z.number().int().nonnegative().default(0),
  alert: z.string().default("특이사항 없음"),
  todayAction: z.string().default(""),
});

export type BriefingStructuredSchemaType = z.infer<typeof BriefingStructuredSchema>;

// ─── expense-classifier.ts ───────────────────────────────────────────────────

/** Single AI classification result for a merchant name */
export const ExpenseClassificationItemSchema = z.object({
  merchantName: z.string(),
  majorCategory: z.string(),
  subCategory: z.string().nullable().default(null),
  confidence: z.number().min(0).max(1).default(0.5),
});

/** Array of classification results returned by Claude */
export const ExpenseClassificationSchema = z.array(ExpenseClassificationItemSchema);

export type ExpenseClassificationSchemaType = z.infer<typeof ExpenseClassificationSchema>;
