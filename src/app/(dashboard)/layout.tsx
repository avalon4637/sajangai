import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Load business info + subscription status for sidebar
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/auth/onboarding");
  }

  let subscriptionStatus = "none";
  if (business) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("business_id", business.id)
      .in("status", ["trial", "active", "expired"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscriptionStatus = sub?.status ?? "none";
  }

  // Check if business has any active data connections
  const { count: activeConnectionCount } = await supabase
    .from("api_connections")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "active");

  const hasActiveConnections = (activeConnectionCount ?? 0) > 0;

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      <Sidebar
        userEmail={user.email ?? ""}
        businessName={business?.name}
        subscriptionStatus={subscriptionStatus}
      />
      <MobileHeader
        userEmail={user.email ?? ""}
        businessName={business?.name}
        subscriptionStatus={subscriptionStatus}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <DemoDataBanner hasActiveConnections={hasActiveConnections} />
        {children}
      </main>
    </div>
  );
}
