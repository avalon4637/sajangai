import Link from "next/link";

export function LandingNav() {
  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #F4F4F5",
      }}
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "0 120px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="px-6 md:px-[120px]"
      >
        {/* Logo */}
        <span
          style={{
            color: "#2563EB",
            fontFamily: "Inter, sans-serif",
            fontSize: "22px",
            fontWeight: 700,
          }}
        >
          사장 AI
        </span>

        {/* CTA Button */}
        <Link href="/auth/login">
          <button
            style={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              padding: "10px 24px",
              border: "none",
              cursor: "pointer",
            }}
          >
            7일 무료 체험
          </button>
        </Link>
      </div>
    </header>
  );
}
