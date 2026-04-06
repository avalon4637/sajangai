import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserBusinesses } from "@/lib/queries/business";
import { AddBusinessForm } from "@/components/business/add-business-form";
import { BusinessList } from "@/components/business/business-list";

export default async function BusinessSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const businesses = await getUserBusinesses();

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">등록된 사업장</h2>
        <BusinessList businesses={businesses} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">사업장 추가</h2>
        <p className="text-sm text-muted-foreground">
          최대 5개 사업장까지 등록할 수 있습니다. (현재 {businesses.length}개)
        </p>
        {businesses.length < 5 ? (
          <AddBusinessForm />
        ) : (
          <p className="text-sm text-amber-600">
            사업장 등록 한도에 도달했습니다.
          </p>
        )}
      </section>
    </>
  );
}
