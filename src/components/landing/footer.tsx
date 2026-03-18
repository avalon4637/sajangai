export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo */}
          <span
            className="text-lg font-bold"
            style={{ color: "var(--landing-primary)" }}
          >
            sajang.ai
          </span>

          {/* Links */}
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">
              이용약관
            </a>
            <span className="text-gray-300">|</span>
            <a href="#" className="transition-colors hover:text-foreground">
              개인정보처리방침
            </a>
          </nav>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>&copy; 2025 sajang.ai. All rights reserved.</p>
          <p>
            문의:{" "}
            <a
              href="mailto:contact@sajang.ai"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              contact@sajang.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
