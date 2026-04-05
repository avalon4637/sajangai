import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { ChatClient } from "./chat-client";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch (error) {
    console.error("[Chat] Failed to get business ID:", error);
    redirect("/auth/onboarding");
  }

  // Fetch business name for chat header
  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <ChatClient
        businessId={businessId}
        businessName={business?.name ?? "매장"}
      />
    </div>
  );
}
