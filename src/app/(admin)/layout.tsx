import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLayout({
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

  // Check admin role
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/auth/onboarding");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("business_id", business.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-zinc-900 px-6 py-3 text-white">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-lg font-bold">
            sajang.ai Admin
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>{user.email}</span>
          <Link
            href="/dashboard"
            className="rounded bg-zinc-700 px-3 py-1 text-zinc-200 hover:bg-zinc-600"
          >
            Dashboard
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
