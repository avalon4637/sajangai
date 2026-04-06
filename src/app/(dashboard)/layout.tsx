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
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      <Sidebar
        userEmail={user.email ?? ""}
        businessName={currentBusiness.name}
        subscriptionStatus={subscriptionStatus}
        businesses={businesses}
        currentBusinessId={currentBusiness.id}
      />
      <MobileHeader
        userEmail={user.email ?? ""}
        businessName={currentBusiness.name}
        subscriptionStatus={subscriptionStatus}
        businesses={businesses}
        currentBusinessId={currentBusiness.id}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <DemoDataBanner hasActiveConnections={hasActiveConnections} />
        {children}
      </main>
    </div>
  );
}
