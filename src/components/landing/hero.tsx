import Link from "next/link";

export function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
        padding: "80px 120px",
      }}
      className="py-[80px] px-6 md:px-[120px]"
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "60px",
        }}
        className="flex flex-col md:flex-row items-center gap-[60px]"
      >
        {/* Left: Hero Copy */}
        <div
          style={{ maxWidth: "800px", flex: "1" }}
          className="w-full"
        >
          {/* Headline */}
          <h1
            style={{
              color: "#18181B",
              fontFamily: "Inter, sans-serif",
              fontSize: "48px",
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: "20px",
              whiteSpace: "pre-line",
            }}
            className="text-3xl md:text-[48px]"
          >
            {`하루 330원, 점장 한 명\n매장 운영을 알아서 챙겨드립니다`}
          </h1>

          {/* Subheadline */}
          <p
            style={{
              color: "#71717A",
              fontFamily: "Inter, sans-serif",
              fontSize: "18px",
              lineHeight: 1.6,
              marginBottom: "32px",
              whiteSpace: "pre-line",
            }}
            className="text-base md:text-[18px]"
          >
            {`리뷰·매출·마케팅, 4명의 AI 팀이 매장을 함께 운영합니다.\n점장, 답장이, 세리, 바이럴이 사장님을 대신해요.`}
          </p>

          {/* CTA Button */}
          <Link href="/auth/login">
            <button
              style={{
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontFamily: "Inter, sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                borderRadius: "12px",
                padding: "16px 32px",
                border: "none",
                cursor: "pointer",
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              7일 무료 체험 시작하기 →
            </button>
          </Link>

          {/* Note */}
          <p
            style={{
              color: "#A1A1AA",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
            }}
          >
            7일 무료 · 카드 등록 없음 · 월 9,900원
          </p>
        </div>

        {/* Right: Phone Frame */}
        <div className="flex justify-center md:justify-end flex-shrink-0">
          <PhoneFrame />
        </div>
      </div>
    </section>
  );
}

function PhoneFrame() {
  return (
    <div
      style={{
        width: "320px",
        backgroundColor: "#F4F4F5",
        borderRadius: "32px",
        padding: "12px",
        border: "2px solid #E4E4E7",
      }}
    >
      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 12px 8px",
          fontSize: "12px",
          color: "#18181B",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
        }}
      >
        <span>9:41</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Battery icon */}
          <div
            style={{
              width: "22px",
              height: "11px",
              border: "1.5px solid #18181B",
              borderRadius: "2px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              padding: "1px",
            }}
          >
            <div
              style={{
                width: "75%",
                height: "100%",
                backgroundColor: "#18181B",
                borderRadius: "1px",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "-4px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "2px",
                height: "6px",
                backgroundColor: "#18181B",
                borderRadius: "0 1px 1px 0",
              }}
            />
          </div>
        </div>
      </div>

      {/* Chat content */}
      <div
        style={{
          backgroundColor: "#F0EBFF",
          borderRadius: "20px",
          padding: "16px",
        }}
      >
        {/* Avatar and name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            👨‍💼
          </div>
          <div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#18181B",
                margin: 0,
              }}
            >
              사장 AI 점장
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                color: "#71717A",
                margin: 0,
              }}
            >
              오후 2:30
            </p>
          </div>
        </div>

        {/* White chat card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#18181B",
              marginBottom: "8px",
            }}
          >
            사장님, 오늘의 매장 리포트입니다
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#71717A",
              lineHeight: 1.5,
              marginBottom: "12px",
            }}
          >
            매출 +8%, 리뷰 3건 답변 완료, 단골 알림 1건
          </p>
          <button
            style={{
              width: "100%",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "8px",
              padding: "8px 12px",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            리포트 자세히 보기 →
          </button>
        </div>
      </div>
    </div>
  );
}
