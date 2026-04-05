"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper: verify current user is admin
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) throw new Error("No business");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("business_id", business.id)
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("Not admin");

  return { supabase, user };
}

// Fetch admin dashboard data
export async function getAdminDashboardData(filter?: string, search?: string) {
  const { supabase } = await requireAdmin();

  // KPI: total users, paid count, MRR
  const { data: allBusinesses } = await supabase
    .from("businesses")
    .select("id, name, business_type, user_id, created_at, is_active");

  const { data: allSubs } = await supabase
    .from("subscriptions")
    .select("id, business_id, plan, status, trial_ends_at, current_period_start, current_period_end, created_at");

  const { data: allProfiles } = await supabase
    .from("user_profiles")
    .select("business_id, role, onboarding_completed");

  const businesses = allBusinesses ?? [];
  const subs = allSubs ?? [];
  const profiles = allProfiles ?? [];

  // Build joined data
  const rows = businesses.map((biz) => {
    const sub = subs.find((s) => s.business_id === biz.id);
    const prof = profiles.find((p) => p.business_id === biz.id);
    return {
      businessId: biz.id,
      businessName: biz.name,
      businessType: biz.business_type,
      isActive: biz.is_active,
      createdAt: biz.created_at,
      subscriptionStatus: sub?.status ?? "none",
      plan: sub?.plan ?? "none",
      trialEndsAt: sub?.trial_ends_at,
      currentPeriodEnd: sub?.current_period_end,
      role: prof?.role ?? "user",
    };
  });

  // Apply filter
  let filtered = rows;
  if (filter && filter !== "all") {
    filtered = filtered.filter((r) => r.subscriptionStatus === filter);
  }

  // Apply search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.businessName.toLowerCase().includes(q) ||
        r.businessType?.toLowerCase().includes(q)
    );
  }

  // KPIs
  const totalUsers = businesses.length;
  const activePaid = subs.filter((s) => s.status === "active" && s.plan === "paid").length;
  const mrr = activePaid * 9900;

  return {
    kpi: { totalUsers, activePaid, mrr },
    rows: filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  };
}

// Update subscription status
export async function updateSubscriptionStatus(
  businessId: string,
  newStatus: string,
  reason?: string
) {
  const { supabase } = await requireAdmin();

  const validStatuses = ["trial", "active", "past_due", "cancelled", "expired"] as const;
  type SubStatus = typeof validStatuses[number];
  if (!validStatuses.includes(newStatus as SubStatus)) {
    return { error: "Invalid status" };
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: newStatus as SubStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", businessId);

  if (error) {
    console.error("[Admin] Failed to update subscription:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

// Deactivate business (soft delete)
export async function deactivateBusiness(businessId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("businesses")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    console.error("[Admin] Failed to deactivate business:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

// Reactivate business
export async function reactivateBusiness(businessId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("businesses")
    .update({
      is_active: true,
      deactivated_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) {
    console.error("[Admin] Failed to reactivate business:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}

// Delete business (only if deactivated 30+ days ago)
export async function deleteBusiness(businessId: string) {
  const { supabase } = await requireAdmin();

  // Check deactivated_at
  const { data: biz } = await supabase
    .from("businesses")
    .select("is_active, deactivated_at")
    .eq("id", businessId)
    .single();

  if (!biz) return { error: "Business not found" };
  if (biz.is_active) return { error: "Business must be deactivated first" };

  if (biz.deactivated_at) {
    const deactivatedDate = new Date(biz.deactivated_at);
    const daysSince = (Date.now() - deactivatedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      return { error: `Cannot delete. ${Math.ceil(30 - daysSince)} days remaining before deletion is allowed.` };
    }
  }

  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);

  if (error) {
    console.error("[Admin] Failed to delete business:", error);
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { success: true };
}
