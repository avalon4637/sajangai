import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (businesses && businesses.length > 0) {
    redirect("/dashboard");
  }

  return <OnboardingForm userId={user.id} />;
}
