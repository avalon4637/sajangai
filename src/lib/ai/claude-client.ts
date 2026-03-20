// Common Claude API client for all AI engines
// Centralizes model constant, prompt caching, and call patterns

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject, streamText } from "ai";
import type { z } from "zod/v4";

export const CLAUDE_MODEL = "claude-sonnet-4-6";

// @MX:ANCHOR: Shared Claude API entry point - used by all AI engine modules
// @MX:REASON: Fan-in from seri-engine, briefing-generator, proactive-diagnosis, review-responder, sentiment-analyzer, brand-voice, expense-classifier

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

/**
 * Call Claude and return plain text.
 * Use for narrative generation where structured output is not required.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 * @param maxTokens - Maximum tokens for the response (default 1024)
 */
export async function callClaudeText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1024
): Promise<string> {
  const { text } = await generateText({
    model: createCachedModel(),
    messages: [
      ...buildCachedSystem(systemPrompt),
      { role: "user", content: userPrompt },
    ],
    maxOutputTokens: maxTokens,
  });
  return text;
}

/**
 * Call Claude and return a validated structured object.
 * Use instead of regex JSON parsing for reliable structured output.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 * @param schema - Zod schema for the expected output shape
 * @param maxTokens - Maximum tokens for the response (default 1024)
 */
export async function callClaudeObject<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T>,
  maxTokens = 1024
): Promise<T> {
  const { object } = await generateObject({
    model: createCachedModel(),
    messages: [
      ...buildCachedSystem(systemPrompt),
      { role: "user", content: userPrompt },
    ],
    schema,
    maxOutputTokens: maxTokens,
  });
  return object;
}

/**
 * Stream Claude responses for real-time display.
 * Returns the streamText result directly for consumer use.
 *
 * @param systemPrompt - Cached system prompt for the call
 * @param userPrompt - User-level prompt with dynamic data
 */
export function callClaudeStream(systemPrompt: string, userPrompt: string) {
  return streamText({
    model: createCachedModel(),
    messages: [
      ...buildCachedSystem(systemPrompt),
      { role: "user", content: userPrompt },
    ],
  });
}
