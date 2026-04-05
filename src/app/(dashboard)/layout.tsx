import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";

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

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
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
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
