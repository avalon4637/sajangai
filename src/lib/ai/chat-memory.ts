// Chat memory v1: extract summaries on session end, inject on session start
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";

const SUMMARY_PROMPT = `Summarize this conversation between a Korean small business owner and their AI assistant.

Output JSON with this exact structure (Korean for summary, English for key_facts):
{
  "summary": "1-2 sentence Korean summary of what was discussed",
  "key_facts": ["fact 1", "fact 2"],
  "follow_ups": ["follow-up item if any"]
}

Only output valid JSON, nothing else.`;

/**
 * Extract a summary from the current session messages and save to conversation_summaries.
 * Called when a session has 5+ messages and is ending.
 */
export async function extractSessionSummary(
  businessId: string,
  sessionId: string
): Promise<void> {
  const supabase = await createClient();

  // Load all messages from session
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!messages || messages.length < 4) return;

  // Check if summary already exists for this session
  const { data: existing } = await supabase
    .from("conversation_summaries")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) return; // Already summarized

  // Build conversation text
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "사장" : "점장"}: ${m.content}`)
    .join("\n");

  try {
    const anthropic = createAnthropic();
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SUMMARY_PROMPT,
      prompt: conversationText.slice(0, 3000), // limit tokens
      maxOutputTokens: 300,
      temperature: 0,
    });

    const parsed = JSON.parse(text);

    await supabase.from("conversation_summaries").insert({
      business_id: businessId,
      session_id: sessionId,
      summary: parsed.summary ?? "",
      key_facts: parsed.key_facts ?? [],
      follow_ups: parsed.follow_ups ?? [],
    });
  } catch (error) {
    // Non-fatal — summary extraction is best-effort
    console.error("[ChatMemory] Failed to extract conversation summary:", error);
  }
}

/**
 * Load recent conversation summaries for context injection.
 * Returns the last 3 session summaries as a formatted string.
 */
export async function loadMemoryContext(
  businessId: string
): Promise<string> {
  const supabase = await createClient();

  const { data: summaries } = await supabase
    .from("conversation_summaries")
    .select("summary, key_facts, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!summaries || summaries.length === 0) return "";

  const lines = summaries.map((s) => {
    const date = new Date(s.created_at).toLocaleDateString("ko-KR");
    const facts = (s.key_facts as string[])?.join(", ") ?? "";
    return `[${date}] ${s.summary}${facts ? ` (${facts})` : ""}`;
  });

  return `[Past Conversations]\n${lines.join("\n")}`;
}
