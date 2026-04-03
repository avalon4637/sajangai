import { createClient } from "@/lib/supabase/server";

export interface UserProfile {
  communicationStyle: "concise" | "detailed" | "conversational";
  focusArea: "revenue" | "review" | "cost" | "all";
  notificationTime: "morning" | "evening" | "both";
  activeHoursStart: number;
  activeHoursEnd: number;
  onboardingCompleted: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  communicationStyle: "concise",
  focusArea: "all",
  notificationTime: "morning",
  activeHoursStart: 7,
  activeHoursEnd: 22,
  onboardingCompleted: false,
};

export async function getUserProfile(
  businessId: string
): Promise<UserProfile> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;

  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!data) return DEFAULT_PROFILE;

  return {
    communicationStyle: data.communication_style ?? "concise",
    focusArea: data.focus_area ?? "all",
    notificationTime: data.notification_time ?? "morning",
    activeHoursStart: data.active_hours_start ?? 7,
    activeHoursEnd: data.active_hours_end ?? 22,
    onboardingCompleted: data.onboarding_completed ?? false,
  };
}

/**
 * Build a system prompt modifier based on user profile.
 * Appended to agent system prompts for personalization.
 */
export function buildProfilePromptModifier(profile: UserProfile): string {
  const lines: string[] = [];

  switch (profile.communicationStyle) {
    case "concise":
      lines.push("Be concise. Lead with numbers and conclusions. Skip detailed explanations unless asked.");
      break;
    case "detailed":
      lines.push("Be thorough. Include root causes, data evidence, and step-by-step reasoning.");
      break;
    case "conversational":
      lines.push("Be warm and conversational. Use a friendly tone as if chatting with a friend. Still include key data.");
      break;
  }

  switch (profile.focusArea) {
    case "revenue":
      lines.push("Prioritize revenue analysis, sales trends, and channel performance in your responses.");
      break;
    case "review":
      lines.push("Prioritize customer review analysis, sentiment trends, and reputation management.");
      break;
    case "cost":
      lines.push("Prioritize cost analysis, expense optimization, and profitability improvement.");
      break;
    case "all":
      lines.push("Cover revenue, reviews, and costs with balanced attention.");
      break;
  }

  return lines.join("\n");
}
