export function LandingFooter() {
  return (
    <footer
      style={{
        backgroundColor: "#18181B",
        height: "80px",
        display: "flex",
        alignItems: "center",
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
        }}
        className="px-6 md:px-[120px] flex items-center justify-between w-full"
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
