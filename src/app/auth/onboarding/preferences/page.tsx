import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { PreferencesForm } from "./preferences-form";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let businessId: string;
  try {
    businessId = await getCurrentBusinessId();
  } catch {
    redirect("/auth/onboarding");
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

      <div className="w-full max-w-md">
        <PreferencesForm businessId={businessId} />
      </div>
    </div>
  );
}
