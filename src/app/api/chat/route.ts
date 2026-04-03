// Streaming chat endpoint for 점장 Q&A
// Supports Tool Use for real-time data queries + conversation memory
// Returns Server-Sent Events stream via AI SDK streamText

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs } from "ai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/jeongjang-prompts";
import { buildBusinessProfile } from "@/lib/ai/business-profile";
import { createChatTools } from "@/lib/ai/chat-tools";
import { getUserProfile, buildProfilePromptModifier } from "@/lib/queries/user-profile";
import { loadMemoryContext, extractSessionSummary } from "@/lib/ai/chat-memory";
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit";

export const maxDuration = 60;

// @MX:ANCHOR: Chat streaming endpoint with Tool Use - core 점장 interaction
// @MX:REASON: Fan-in from chat-client.tsx (POST) - central conversational AI entry point

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  businessId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

/**
 * Save a single message to the chat_messages table.
 * Non-blocking - failures are logged but do not halt the response.
 */
async function saveMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await supabase.from("chat_messages").insert({
    business_id: businessId,
    session_id: sessionId,
    role,
    content,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit: 10 requests per minute per user
  const rlKey = getRateLimitKey(req, "chat");
  const rl = checkRateLimit(rlKey, 10);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "잘못된 요청 형식입니다.",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { message, businessId, sessionId: clientSessionId } = parsed.data;

  // Use provided sessionId or generate a new UUID
  const sessionId =
    clientSessionId ??
    crypto.randomUUID();

  // Verify user owns this business (if provided)
  let verifiedBusinessId: string | undefined;
  if (businessId) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, user_id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (business) {
      verifiedBusinessId = business.id;
    }
  }

  // Build business profile for system context
  let profile = "";
  if (verifiedBusinessId) {
    try {
      profile = await buildBusinessProfile(verifiedBusinessId);
    } catch (err) {
      console.error("[chat] profile build error:", err);
      // Profile build failure is non-fatal - proceed without it
    }
  }

  // Load last 10 messages from this session for multi-turn context
  let historyMessages: Array<{ role: "user" | "assistant"; content: string }> =
    [];
  if (verifiedBusinessId) {
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(10);

    historyMessages = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  // Build messages array for multi-turn conversation
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...historyMessages,
    { role: "user" as const, content: message },
  ];

  // Save user message to DB (non-blocking)
  if (verifiedBusinessId) {
    saveMessage(supabase, verifiedBusinessId, sessionId, "user", message).catch(
      (err) => console.error("[chat] Failed to save user message:", err)
    );
  }

  // Load user preferences for personalization
  let profileModifier = "";
  if (verifiedBusinessId) {
    try {
      const userProfile = await getUserProfile(verifiedBusinessId);
      profileModifier = buildProfilePromptModifier(userProfile);
    } catch (err) {
      console.error("[chat] user profile error:", err);
      // Non-fatal
    }
  }

  // Load past conversation memory for cross-session context
  let memoryContext = "";
  if (verifiedBusinessId) {
    try {
      memoryContext = await loadMemoryContext(verifiedBusinessId);
    } catch (err) {
      console.error("[chat] memory context error:", err);
      // Non-fatal
    }
  }

  const systemWithProfile = [
    CHAT_SYSTEM_PROMPT,
    profile,
    profileModifier,
    memoryContext,
  ].filter(Boolean).join("\n\n");

  // Create tools scoped to this business
  const tools = verifiedBusinessId
    ? createChatTools(verifiedBusinessId)
    : undefined;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemWithProfile,
    messages,
    tools,
    stopWhen: stepCountIs(3), // Allow up to 3 tool call steps per message
    onFinish: async ({ text }) => {
      if (!verifiedBusinessId || !text) return;

      // Save assistant response
      saveMessage(supabase, verifiedBusinessId, sessionId, "assistant", text)
        .catch((err) => console.error("[chat] Failed to save assistant message:", err));

      // Extract session summary if enough messages accumulated (fire-and-forget)
      extractSessionSummary(verifiedBusinessId, sessionId)
        .catch((err) => console.error("[chat] Failed to extract summary:", err));
    },
  });

  // Return plain text stream; session ID in header for client to persist
  const response = result.toTextStreamResponse();
  const headers = new Headers(response.headers);
  headers.set("X-Session-Id", sessionId);

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
