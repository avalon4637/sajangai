const steps = [
  {
    emoji: "💬",
    name: "답장이",
    role: "리뷰 매니저",
    desc: "리뷰를 수집하고 감성 분석 후 자동으로 답글을 작성합니다. 사장님은 승인만 하세요.",
  },
  {
    emoji: "📈",
    name: "세리",
    role: "매출 분석가",
    desc: "매출을 집계하고 이상 징후를 감지합니다. 플랫폼별 정산도 알아서 분석해요.",
  },
  {
    emoji: "📣",
    name: "바이럴",
    role: "마케터",
    desc: "단골 고객 재방문을 유도하고 SNS 마케팅 전략을 제안합니다.",
  },
];

export function SolutionSection() {
  return (
    <section
      id="solution"
      style={{
        backgroundColor: "#F9FAFB",
        padding: "80px 120px",
      }}
      className="py-[80px] px-6 md:px-[120px]"
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
        {/* Title & Subtitle */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              color: "#18181B",
              fontFamily: "Inter, sans-serif",
              fontSize: "32px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
            className="text-2xl md:text-[32px]"
          >
            AI 점장팀이 알아서 챙겨드립니다
          </h2>
          <p
            style={{
              color: "#71717A",
              fontFamily: "Inter, sans-serif",
              fontSize: "16px",
            }}
          >
            4명의 AI 팀원이 각자 영역에서 매장을 운영합니다
          </p>
        </div>

        {/* Step Cards */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
          }}
          className="flex flex-col md:flex-row gap-6"
        >
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: "360px",
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "32px 24px",
                border: "1px solid #E4E4E7",
              }}
              className="w-full"
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "12px",
                }}
              >
                {step.emoji}
              </div>
              <p
                style={{
                  color: "#2563EB",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {step.role}
              </p>
              <h3
                style={{
                  color: "#18181B",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {step.name}
              </h3>
              <p
                style={{
                  color: "#71717A",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
