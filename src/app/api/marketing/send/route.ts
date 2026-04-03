import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const formData = await request.formData();
  const businessId = formData.get("businessId") as string;
  const platform = formData.get("platform") as string;

  if (!businessId || !platform) {
    redirect("/marketing");
  }

  // Verify ownership
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (!biz) redirect("/marketing");

  // Generate and send re-engagement message
  try {
    const { runViralAnalysis } = await import("@/lib/ai/viral-engine");
    const analysis = await runViralAnalysis(businessId);

    if (analysis.messages.length > 0) {
      const { sendInsightAlert } = await import("@/lib/messaging/sender");
      await sendInsightAlert(businessId, {
        businessName: biz.name,
        severity: "info",
        insightTitle: `${platform} 재방문 유도`,
        recommendation: analysis.messages[0].message,
      });
    }
  } catch (err) {
    console.error("[marketing/send] Failed:", err);
  }

  redirect("/marketing");
}
