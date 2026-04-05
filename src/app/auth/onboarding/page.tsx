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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Brand header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          사장.ai
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          소상공인을 위한 AI 경영 도우미
        </p>
      </div>

      {/* Onboarding card */}
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>

      {/* Trust note */}
      <p className="text-xs text-muted-foreground mt-6 text-center break-keep">
        사업장 정보는 매출 분석에만 사용되며 외부에 공유되지 않습니다.
      </p>
    </div>
  );
}
