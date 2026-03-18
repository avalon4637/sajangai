const beforeItems = [
  "리뷰 플랫폼 3개를 매일 직접 확인",
  "답변 하나에 5~10분 소요",
  "매출 데이터 직접 정리",
  "마케팅은 엄두도 못 냄",
];

const afterItems = [
  "AI가 자동으로 리뷰 수집 및 답변",
  "승인만 하면 30초 완료",
  "매출 분석 자동 리포트",
  "단골 관리 및 마케팅 자동화",
];

export function ComparisonSection() {
  return (
    <section
      id="comparison"
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
          기존 방식 vs AI 점장
        </h2>

        {/* Two Cards */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
          }}
          className="flex flex-col md:flex-row gap-6"
        >
          {/* Before Card */}
          <div
            style={{
              flex: 1,
              maxWidth: "560px",
              border: "2px solid #FCA5A5",
              borderRadius: "16px",
              padding: "32px",
              backgroundColor: "#FFF5F5",
            }}
            className="w-full"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <span style={{ fontSize: "20px" }}>😓</span>
              <h3
                style={{
                  color: "#18181B",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                기존 방식
              </h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {beforeItems.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#FEE2E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "12px",
                      color: "#EF4444",
                      fontWeight: 700,
                      marginTop: "1px",
                    }}
                  >
                    ✕
                  </span>
                  <span
                    style={{
                      color: "#71717A",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* After Card */}
          <div
            style={{
              flex: 1,
              maxWidth: "560px",
              border: "2px solid #93C5FD",
              borderRadius: "16px",
              padding: "32px",
              backgroundColor: "#EFF6FF",
            }}
            className="w-full"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
              <span style={{ fontSize: "20px" }}>🚀</span>
              <h3
                style={{
                  color: "#18181B",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                AI 점장 사용
              </h3>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {afterItems.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#DBEAFE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "12px",
                      color: "#2563EB",
                      fontWeight: 700,
                      marginTop: "1px",
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      color: "#18181B",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
