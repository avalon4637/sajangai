const problems = [
  {
    icon: "😤",
    text: "리뷰 플랫폼 3개를 매일 확인하느라 시간이 너무 많이 든다",
  },
  {
    icon: "📊",
    text: "매출이 왜 떨어지는지 원인을 파악하기가 어렵다",
  },
  {
    icon: "📣",
    text: "단골 고객 관리나 마케팅은 엄두도 못 내고 있다",
  },
];

export function ProblemSection() {
  return (
    <section
      id="problem"
      style={{
        backgroundColor: "#FFFFFF",
        padding: "80px 120px",
      }}
      className="py-[80px] px-6 md:px-[120px]"
    >
      <div style={{ maxWidth: "1440px", margin: "0 auto" }}>
        {/* Title */}
        <h2
          style={{
            color: "#18181B",
            fontFamily: "Inter, sans-serif",
            fontSize: "32px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "48px",
          }}
          className="text-2xl md:text-[32px]"
        >
          이런 경험, 있으시죠?
        </h2>

        {/* Cards */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
          }}
          className="flex flex-col md:flex-row gap-6"
        >
          {problems.map((item, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: "360px",
                border: "1px solid #F4F4F5",
                borderRadius: "16px",
                padding: "32px 24px",
                textAlign: "center",
                backgroundColor: "#FAFAFA",
              }}
              className="w-full"
            >
              <div
                style={{
                  fontSize: "40px",
                  marginBottom: "16px",
                }}
              >
                {item.icon}
              </div>
              <p
                style={{
                  color: "#18181B",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
