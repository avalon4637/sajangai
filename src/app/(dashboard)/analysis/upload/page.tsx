// Upload page for SPEC-SERI-002
// Auth check + statement upload + classification preview

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadPageClient } from "./page-client";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <UploadPageClient />;
}
