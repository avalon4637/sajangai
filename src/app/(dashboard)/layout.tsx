import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { DemoDataBanner } from "@/components/demo-data-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Load ALL businesses for the user (multi-business support)
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!businesses || businesses.length === 0) {
    redirect("/auth/onboarding");
  }

  // Get selected business from cookie (with validation & fallback)
  const currentBusinessId = await getCurrentBusinessId();
  const currentBusiness =
    businesses.find((b) => b.id === currentBusinessId) ?? businesses[0];

  // Load subscription for CURRENT business
  let subscriptionStatus = "none";
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("business_id", currentBusiness.id)
    .in("status", ["trial", "active", "expired"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  subscriptionStatus = sub?.status ?? "none";

  // Check if current business has any active data connections
  const { count: activeConnectionCount } = await supabase
    .from("api_connections")
    .select("*", { count: "exact", head: true })
    .eq("business_id", currentBusiness.id)
    .eq("status", "active");

  const hasActiveConnections = (activeConnectionCount ?? 0) > 0;

  return (
    <div className="flex h-[100dvh] flex-col md:flex-row overflow-hidden">
      <Sidebar
        userEmail={user.email ?? ""}
        businessName={currentBusiness.name}
        subscriptionStatus={subscriptionStatus}
        businesses={businesses}
        currentBusinessId={currentBusiness.id}
      />
      <div className="flex flex-1 flex-col min-h-0 md:flex-row">
        <div className="flex flex-1 flex-col min-h-0">
          <MobileHeader
            userEmail={user.email ?? ""}
            businessName={currentBusiness.name}
            subscriptionStatus={subscriptionStatus}
            businesses={businesses}
            currentBusinessId={currentBusiness.id}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* BETA banner — transparent about service state */}
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-2 py-0.5 font-bold tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                BETA
              </span>
              <span className="leading-relaxed">
                사장AI는 기능 추가 중이에요. 일부 기능(월간 ROI, 배달앱 자동
                수집)은 순차 공개돼요.
              </span>
            </div>
            <DemoDataBanner hasActiveConnections={hasActiveConnections} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
