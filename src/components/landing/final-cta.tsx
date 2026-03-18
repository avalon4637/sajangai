import Link from "next/link";

export function FinalCTASection() {
  return (
    <section
      id="cta-final"
      style={{
        background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)",
        padding: "80px 120px",
        textAlign: "center",
      }}
      className="py-[80px] px-6 md:px-[120px]"
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
        {/* Title */}
        <h2
          style={{
            color: "#FFFFFF",
            fontFamily: "Inter, sans-serif",
            fontSize: "36px",
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: "16px",
            whiteSpace: "pre-line",
          }}
          className="text-2xl md:text-[36px]"
        >
          {`매장 운영, 오늘부터\nAI 점장에게 맡기세요`}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            color: "#BFDBFE",
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            marginBottom: "32px",
          }}
        >
          7일 무료 체험 · 카드 등록 없음 · 월 9,900원
        </p>

        {/* CTA Button */}
        <Link href="/auth/login">
          <button
            style={{
              backgroundColor: "#FFFFFF",
              color: "#2563EB",
              fontFamily: "Inter, sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              borderRadius: "12px",
              padding: "16px 40px",
              border: "none",
              cursor: "pointer",
              display: "inline-block",
            }}
          >
            7일 무료 체험 시작하기 →
          </button>
        </Link>
      </div>
    </section>
  );
}
