// Expense upload page for SPEC-FINANCE-002 M1
// Auth check + file upload + classification preview + bulk insert

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadPageClient } from "./page-client";

export default async function TransactionUploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <UploadPageClient />;
}
