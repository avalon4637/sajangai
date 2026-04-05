import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#F1F5F9] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-[#1E40AF]"
          aria-label="sajang.ai 홈으로"
        >
          sajang.ai
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            로그인
          </Link>
          <Link href="/auth/signup">
            <button
              className="h-9 rounded-lg px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#1E40AF" }}
            >
              무료 체험
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
