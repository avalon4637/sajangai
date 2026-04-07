import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OperationsClient } from "./operations-client";

export const dynamic = "force-dynamic";

export default async function AdminOperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch businesses for trigger dropdown
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, naver_place_id, naver_last_synced_at")
    .order("name");

  // Fetch recent reports (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id, business_id, report_date, report_type, summary, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  const bizMap = Object.fromEntries(
    (businesses ?? []).map((b) => [b.id, b.name])
  );

  return (
    <OperationsClient
      businesses={(businesses ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        naverPlaceId: b.naver_place_id,
        naverLastSyncedAt: b.naver_last_synced_at,
      }))}
      reports={(reports ?? []).map((r) => ({
        ...r,
        businessName: bizMap[r.business_id] ?? "Unknown",
      }))}
    />
  );
}
