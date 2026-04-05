import { getAdminDashboardData } from "@/lib/actions/admin";
import { AdminDashboardClient } from "./page-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminDashboardData();

  return <AdminDashboardClient initialData={data} />;
}
