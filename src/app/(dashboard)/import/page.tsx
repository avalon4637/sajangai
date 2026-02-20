import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusinessId } from "@/lib/queries/business";
import { CsvUploadZone } from "@/components/import/csv-upload-zone";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    await getCurrentBusinessId();
  } catch {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">데이터 임포트</h1>
        <p className="text-muted-foreground mt-1">
          CSV 파일을 업로드하여 매출/비용 데이터를 일괄 등록합니다.
        </p>
      </div>
      <CsvUploadZone />
    </div>
  );
}
