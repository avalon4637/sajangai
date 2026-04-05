"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
    >
      로그아웃
    </button>
  );
}
