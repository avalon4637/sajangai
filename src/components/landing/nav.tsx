import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function LandingNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-blue-800"
          aria-label="sajang.ai 홈으로"
        >
          sajang.ai
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-500 hidden sm:inline">
                <strong className="text-slate-800">
                  {user.email?.split("@")[0]}
                </strong>
                님 반갑습니다
              </span>
              <Link
                href="/dashboard"
                className="h-9 flex items-center rounded-lg bg-blue-800 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                대시보드
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="h-9 flex items-center rounded-lg bg-blue-800 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                무료 체험
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
