// Common Claude API client for all AI engines
// Centralizes model constant, prompt caching, call patterns, and cost/latency logging.

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, streamText } from "ai";
import type { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const CLAUDE_HAIKU_MODEL = "claude-haiku-4-5-20251001";

// @MX:ANCHOR: Shared Claude API entry point - used by all AI engine modules
// @MX:REASON: Fan-in from seri-engine, briefing-generator, proactive-diagnosis, review-responder, sentiment-analyzer, brand-voice, expense-classifier
// @MX:NOTE: All public call* functions log to ai_call_logs (Phase 0.5). Logging failures never break the main flow.

// ─── Pricing table (USD per 1M tokens) ───────────────────────────────────────
// Source: public Anthropic pricing as of 2026-04. Update when Anthropic adjusts.
const PRICING_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
};

// Approximate KRW conversion rate. Intentionally simple — we care about
// order-of-magnitude cost tracking, not accounting-grade numbers.
const USD_TO_KRW = 1400;

function estimateCostKrw(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING_USD_PER_MTOK[model];
  if (!pricing) return 0;
  const usd =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;
  return Number((usd * USD_TO_KRW).toFixed(4));
}

// ─── Logging helper ──────────────────────────────────────────────────────────

export interface AiCallContext {
  caller?: string;
  businessId?: string | null;
}

interface LogPayload {
  functionName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  latencyMs: number;
  status: "success" | "error";
  errorCode?: string;
  errorMessage?: string;
  context?: AiCallContext;
}

/**
 * Insert one row into ai_call_logs. Never throws — logging must not break
 * the main AI flow. Errors are written to console.error so the Vercel log
 * drain still picks them up.
 */
async function logAiCall(payload: LogPayload): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("ai_call_logs").insert({
      business_id: payload.context?.businessId ?? null,
      caller: payload.context?.caller ?? null,
      function_name: payload.functionName,
      model: payload.model,
      input_tokens: payload.inputTokens,
      output_tokens: payload.outputTokens,
      cache_read_tokens: payload.cacheReadTokens ?? 0,
      cache_write_tokens: payload.cacheWriteTokens ?? 0,
      cost_krw: estimateCostKrw(
        payload.model,
        payload.inputTokens,
        payload.outputTokens
      ),
      latency_ms: payload.latencyMs,
      status: payload.status,
      error_code: payload.errorCode ?? null,
      error_message: payload.errorMessage ?? null,
    });
  } catch (err) {
    // Logging must never break the caller.
    console.error("[ai_call_log] insert failed:", err);
  }
}

interface UsageShape {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}

function extractTokens(usage: UsageShape | undefined): {
  input: number;
  output: number;
  cacheRead: number;
} {
  return {
    input: usage?.inputTokens ?? usage?.promptTokens ?? 0,
    output: usage?.outputTokens ?? usage?.completionTokens ?? 0,
    cacheRead: usage?.cachedInputTokens ?? 0,
  };
}

function serializeError(err: unknown): {
  code: string;
  message: string;
} {
  if (err instanceof Error) {
    return { code: err.name, message: err.message };
  }
  return { code: "UnknownError", message: String(err) };
}

// ─── Model factory ───────────────────────────────────────────────────────────

/**
 * Create a model instance.
 * Prompt caching is applied via providerOptions in the message payload.
 */
function createCachedModel() {
  const anthropic = createAnthropic();
  return anthropic(CLAUDE_MODEL);
}

/**
 * Build a system prompt message that includes Anthropic ephemeral cache control.
 * Returns an empty array when systemPrompt is blank so callers can skip it.
 * Reduces token costs for repeated calls with the same system prompt.
 */
function buildCachedSystem(systemPrompt: string) {
  if (!systemPrompt) return [];
  return [
    {
      role: "system" as const,
      content: systemPrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" as const } },
      },
    },
  ];
}

// ─── Public call functions ───────────────────────────────────────────────────

/**
 * Call Claude and return plain text.
 * Use for narrative generation where structured output is not required.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 * @param maxTokens - Maximum tokens for the response (default 1024)
 * @param context - Optional logging context (caller name, business id)
 */
export async function callClaudeText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024,
  context?: AiCallContext
): Promise<string> {
  const startedAt = Date.now();
  try {
    const result = await generateText({
      model: createCachedModel(),
      messages: [
        ...buildCachedSystem(systemPrompt),
        { role: "user", content: userPrompt },
      ],
      maxOutputTokens: maxTokens,
    });
    const tokens = extractTokens(result.usage as UsageShape | undefined);
    void logAiCall({
      functionName: "callClaudeText",
      model: CLAUDE_MODEL,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      cacheReadTokens: tokens.cacheRead,
      latencyMs: Date.now() - startedAt,
      status: "success",
      context,
    });
    return result.text;
  } catch (err) {
    const { code, message } = serializeError(err);
    void logAiCall({
      functionName: "callClaudeText",
      model: CLAUDE_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      status: "error",
      errorCode: code,
      errorMessage: message,
      context,
    });
    throw err;
  }
}

/**
 * Call Claude and return a validated structured object.
 * Use instead of regex JSON parsing for reliable structured output.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 * @param schema - Zod schema for the expected output shape
 * @param maxTokens - Maximum tokens for the response (default 1024)
 * @param context - Optional logging context (caller name, business id)
 */
export async function callClaudeObject<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  maxTokens = 1024,
  context?: AiCallContext
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await generateObject({
      model: createCachedModel(),
      messages: [
        ...buildCachedSystem(systemPrompt),
        { role: "user", content: userPrompt },
      ],
      schema,
      maxOutputTokens: maxTokens,
    });
    const tokens = extractTokens(result.usage as UsageShape | undefined);
    void logAiCall({
      functionName: "callClaudeObject",
      model: CLAUDE_MODEL,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      cacheReadTokens: tokens.cacheRead,
      latencyMs: Date.now() - startedAt,
      status: "success",
      context,
    });
    return result.object;
  } catch (err) {
    const { code, message } = serializeError(err);
    void logAiCall({
      functionName: "callClaudeObject",
      model: CLAUDE_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      status: "error",
      errorCode: code,
      errorMessage: message,
      context,
    });
    throw err;
  }
}

/**
 * Stream Claude responses for real-time display.
 * Returns the streamText result directly for consumer use.
 *
 * Note: streaming calls are logged when the consumer awaits `.usage`. For Phase 0
 * we log a "stream_started" marker row on invocation; the consumer is responsible
 * for the full usage breakdown via the streamText result.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 * @param context - Optional logging context (caller name, business id)
 */
export function callClaudeStream(
  systemPrompt: string,
  userPrompt: string,
  context?: AiCallContext
) {
  // Fire-and-forget marker log so streaming calls still show up in ai_call_logs.
  void logAiCall({
    functionName: "callClaudeStream",
    model: CLAUDE_MODEL,
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    status: "success",
    context,
  });

  return streamText({
    model: createCachedModel(),
    messages: [
      ...buildCachedSystem(systemPrompt),
      { role: "user", content: userPrompt },
    ],
  });
}

/**
 * Call Claude Haiku for lightweight, cost-efficient tasks.
 * Use for simple classifications, short text generation, and high-frequency calls
 * where Sonnet-level reasoning is not required. ~70% cheaper than Sonnet.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 * @param maxTokens - Maximum tokens for the response (default 512)
 * @param context - Optional logging context (caller name, business id)
 */
export async function callClaudeHaiku(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 512,
  context?: AiCallContext
): Promise<string> {
  const startedAt = Date.now();
  const anthropic = createAnthropic();
  const model = anthropic(CLAUDE_HAIKU_MODEL);
  try {
    const result = await generateText({
      model,
      messages: [
        ...buildCachedSystem(systemPrompt),
        { role: "user", content: userPrompt },
      ],
      maxOutputTokens: maxTokens,
    });
    const tokens = extractTokens(result.usage as UsageShape | undefined);
    void logAiCall({
      functionName: "callClaudeHaiku",
      model: CLAUDE_HAIKU_MODEL,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      cacheReadTokens: tokens.cacheRead,
      latencyMs: Date.now() - startedAt,
      status: "success",
      context,
    });
    return result.text;
  } catch (err) {
    const { code, message } = serializeError(err);
    void logAiCall({
      functionName: "callClaudeHaiku",
      model: CLAUDE_HAIKU_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startedAt,
      status: "error",
      errorCode: code,
      errorMessage: message,
      context,
    });
    throw err;
  }
}
