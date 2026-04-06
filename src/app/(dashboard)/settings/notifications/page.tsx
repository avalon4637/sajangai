import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/lib/actions/notification";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const preferences = await getNotificationPreferences();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">알림 설정</h2>
        <p className="text-sm text-muted-foreground">
          카카오톡 알림톡 및 SMS 알림을 관리합니다.
        </p>
      </div>
      <NotificationSettings initialPreferences={preferences} />
    </section>
  );
}
