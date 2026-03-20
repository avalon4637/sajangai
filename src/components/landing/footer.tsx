import Link from "next/link";

export function LandingFooter() {
  return (
    <footer
      style={{
        backgroundColor: "#18181B",
        padding: "32px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          width: "100%",
          padding: "0 120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
        className="px-6 md:px-[120px]"
      >
        {/* Logo */}
        <span
          style={{
            color: "#71717A",
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          사장 AI
        </span>

        {/* Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <Link
            href="/terms"
            style={{
              color: "#71717A",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
            className="hover:text-[#A1A1AA] transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            style={{
              color: "#71717A",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
            className="hover:text-[#A1A1AA] transition-colors"
          >
            개인정보처리방침
          </Link>
          <a
            href="mailto:support@sajang.ai"
            style={{
              color: "#71717A",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              textDecoration: "none",
            }}
            className="hover:text-[#A1A1AA] transition-colors"
          >
            문의하기
          </a>
        </nav>

        {/* Copyright */}
        <p
          style={{
            color: "#52525B",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
          }}
        >
          © 2026 sajang.ai. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
