"use client";

import { BriefingRichCard } from "@/components/dashboard/briefing-rich-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { ReviewAlertCard } from "@/components/dashboard/review-alert-card";
import { CashflowWarningCard } from "@/components/dashboard/cashflow-warning-card";
import { PeriodReportCard } from "@/components/dashboard/period-report-card";
import { SubscriptionAlertCard } from "@/components/dashboard/subscription-alert-card";
import { WeeklyReportCard } from "@/components/dapjangi/weekly-report-card";

// Kakao-style message preview bubble
function KakaoPreview({
  title,
  body,
  button,
}: {
  title: string;
  body: string;
  button: string;
}) {
  return (
    <div className="rounded-xl bg-[#B2C7D9] p-3 max-w-[320px]">
      <div className="rounded-lg bg-white p-3 text-xs leading-relaxed space-y-1.5">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-slate-700 whitespace-pre-line">{body}</p>
        <div className="pt-1.5 border-t">
          <button
            type="button"
            className="w-full text-center text-blue-600 text-xs py-1.5 font-medium"
          >
            {button}
          </button>
        </div>
      </div>
    </div>
  );
}

// Section wrapper with label
function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-white">
          {label}
        </span>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// Two-column layout: kakao left, app card right
function CompareRow({
  kakao,
  card,
}: {
  kakao: React.ReactNode;
  card: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">
          카카오톡 알림톡
        </p>
        {kakao}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500">
          앱 카드
        </p>
        {card}
      </div>
    </div>
  );
}

export function CardPreviewClient() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-900">
            카드 프리뷰 갤러리
          </h1>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            프리뷰
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          카카오톡 알림톡 템플릿과 앱 시각화 카드의 1:1 매핑을 확인합니다. 더미
          데이터로 렌더링됩니다.
        </p>
      </div>

      {/* A. Daily Briefing */}
      <Section label="A" title="일일 브리핑">
        <CompareRow
          kakao={
            <KakaoPreview
              title="[사장AI] 오늘의 브리핑"
              body={`맛나분식 사장님, 좋은 아침이에요!

어제 매출: 920,000원 (▼26.4%)
순이익: -150,000원
리뷰: 8건 (미답변 3건)

어제 매출이 전일 대비 26% 줄었어요. 화요일 평균과 비교하면 정상 범위이지만, 리뷰 미답변 3건이 쌓이고 있어 확인이 필요합니다.`}
              button="대시보드 보기"
            />
          }
          card={
            <BriefingRichCard
              revenue={920000}
              revenueChange={-26.4}
              netProfit={-150000}
              profitMargin={-16.3}
              weeklyChange={8.2}
              monthProjection={3820000}
              monthTarget={5000000}
              reviewCount={8}
              unansweredReviews={3}
              briefingText="어제 매출이 전일 대비 26% 줄었어요. 화요일 평균과 비교하면 정상 범위이지만, 리뷰 미답변 3건이 쌓이고 있어 확인이 필요합니다."
              time="오전 7:30"
            />
          }
        />
      </Section>

      {/* B. Insight Alert */}
      <Section label="B" title="인사이트 알림">
        <CompareRow
          kakao={
            <div className="space-y-3">
              <KakaoPreview
                title="[사장AI] 긴급 인사이트"
                body={`맛나분식 사장님, 중요한 변화가 감지되었습니다.

[긴급] 매출 -32% 감지
리뷰 미답변 3건이 원인으로 추정됩니다. 지난달에도 같은 패턴이 있었어요.`}
                button="인사이트 확인하기"
              />
              <KakaoPreview
                title="[사장AI] 이상 매출 감지"
                body={`맛나분식 사장님, 매출 이상이 감지되었습니다.

유형: 급락
지표: 일매출
현재: 280,000원
평소: 520,000원
변화율: -46.2%`}
                button="상세 분석 보기"
              />
            </div>
          }
          card={
            <div className="space-y-3">
              <InsightCard
                severity="critical"
                title="매출 -32% 감지"
                description="리뷰 미답변 3건이 원인으로 추정됩니다. 지난달에도 같은 패턴이 있었어요."
                actionLabel="상세 보기"
                actionHref="/analysis"
                time="2시간 전"
              />
              <InsightCard
                severity="warning"
                title="인건비 비율 38%"
                description="업종 평균 25% 대비 높습니다. 피크 시간대 인력 배분을 조정해보세요."
                actionLabel="시뮬레이션"
                actionHref="/analysis"
                time="오늘"
              />
              <InsightCard
                severity="info"
                title="금요일 매출 최고 기록"
                description="이번 주 금요일 매출 52만원으로 월간 최고를 기록했습니다."
                time="어제"
              />
            </div>
          }
        />
      </Section>

      {/* C. Urgent Review */}
      <Section label="C" title="긴급 리뷰">
        <CompareRow
          kakao={
            <KakaoPreview
              title="[사장AI] 부정 리뷰 접수"
              body={`맛나분식 사장님, 부정 리뷰가 접수되었어요.

플랫폼: 배민
별점: 2점
내용: 배달이 너무 늦었어요. 음식도 식어서 왔고 포장도 엉망이었습니다. 다시는 안 시킵니다.

빠른 답변이 고객 이탈을 방지합니다.`}
              button="리뷰 확인하기"
            />
          }
          card={
            <ReviewAlertCard
              platform="배민"
              rating={2}
              preview="배달이 너무 늦었어요. 음식도 식어서 왔고 포장도 엉망이었습니다. 다시는 안 시킵니다."
            />
          }
        />
      </Section>

      {/* D. Cashflow Warning */}
      <Section label="D" title="자금 경고">
        <CompareRow
          kakao={
            <KakaoPreview
              title="[사장AI] 자금 부족 경고"
              body={`맛나분식 사장님, 자금 주의가 필요합니다.

경고일: 4월 10일
예상 잔액: 1,200,000원
위험 기준: 5,000,000원

임대료(250만), 인건비(180만) 등 대규모 지출이 예정되어 있어요.`}
              button="자금 현황 보기"
            />
          }
          card={
            <CashflowWarningCard
              currentBalance={3250000}
              projectedBalance={1200000}
              daysUntilDanger={3}
              threshold={5000000}
              upcomingExpenses={[
                { name: "임대료", amount: 2500000, date: "4월 10일" },
                { name: "인건비", amount: 1800000, date: "4월 15일" },
                { name: "보험료", amount: 180000, date: "4월 20일" },
              ]}
            />
          }
        />
      </Section>

      {/* E. Period Reports */}
      <Section label="E" title="주간/월간 리포트">
        <CompareRow
          kakao={
            <div className="space-y-3">
              <KakaoPreview
                title="[사장AI] 주간 성과 요약"
                body={`맛나분식 사장님, 이번 주 성과를 정리했어요.

주간 매출: 2,800,000원 (▲8.2%)
순이익: 820,000원 (▲12.1%)
리뷰 평점: 4.5 / 5.0
하이라이트: 금요일 매출 최고 (52만)`}
                button="주간 리포트 보기"
              />
              <KakaoPreview
                title="[사장AI] 이달의 점장 성과"
                body={`맛나분식 사장님, 4월 점장 성과입니다.

절약 비용: 470,000원
추가 수익: 280,000원
절약 시간: 23시간
ROI: 25.0배 (월 29,700원 투자)

점장 한 명이 한 달간 이만큼 챙겼어요!`}
                button="성과 상세 보기"
              />
            </div>
          }
          card={
            <div className="space-y-3">
              <PeriodReportCard
                type="weekly"
                period="3/31~4/6"
                revenue={2800000}
                revenueChange={8.2}
                profit={820000}
                profitChange={12.1}
                reviewAvg={4.5}
                highlight="금요일 매출 최고 (52만)"
                lowlight="화요일 매출 최저 (28만)"
              />
              <PeriodReportCard
                type="monthly_roi"
                savedMoney={470000}
                earnedMoney={280000}
                savedHours={23}
                roiMultiple={25}
                monthlyCost={29700}
              />
            </div>
          }
        />
      </Section>

      {/* F. Subscription Alerts */}
      <Section label="F" title="구독 알림">
        <CompareRow
          kakao={
            <div className="space-y-3">
              <KakaoPreview
                title="[사장AI] 구독 시작 안내"
                body={`맛나분식 사장님, 점장 고용이 완료되었습니다!

플랜: 점장 고용
시작일: 2026.4.6
다음 결제일: 2026.5.6

이제 AI 점장이 매장 운영을 챙겨드릴게요.`}
                button="대시보드 바로가기"
              />
              <KakaoPreview
                title="[사장AI] 구독 만료 예정"
                body={`맛나분식 사장님, 구독이 곧 만료됩니다.

플랜: 점장 고용
만료일: 2026.4.9
남은 기간: 3일

구독을 연장하면 AI 점장이 계속 챙겨드려요.`}
                button="구독 연장하기"
              />
              <KakaoPreview
                title="[사장AI] 결제 실패 안내"
                body={`맛나분식 사장님, 결제가 실패했습니다.

플랜: 점장 고용
실패일: 2026.4.6
사유: 카드 한도 초과

결제 수단을 변경해주세요.`}
                button="결제 수단 변경"
              />
            </div>
          }
          card={
            <div className="space-y-3">
              <SubscriptionAlertCard
                type="started"
                planName="점장 고용"
                date="2026.4.6"
                nextBillingDate="2026.5.6"
              />
              <SubscriptionAlertCard
                type="expiring"
                planName="점장 고용"
                date="2026.4.9"
                daysRemaining={3}
              />
              <SubscriptionAlertCard
                type="payment_failed"
                planName="점장 고용"
                date="2026.4.6"
                failReason="카드 한도 초과"
              />
            </div>
          }
        />
      </Section>

      {/* G. Weekly Review Report (app only) */}
      <Section label="G" title="주간 리뷰 분석">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">
            앱 카드만 (카카오톡 템플릿 없음)
          </p>
          <div className="max-w-xl">
            <WeeklyReportCard
              report={{
                summary:
                  "이번 주 리뷰 12건 중 긍정 9건, 부정 2건, 중립 1건입니다. 평균 별점 4.3으로 지난주 대비 0.2점 상승했습니다. '친절한 서비스'와 '빠른 배달' 키워드가 자주 언급되었어요.",
                stats: {
                  newCount: 12,
                  positiveCount: 9,
                  negativeCount: 2,
                  neutralCount: 1,
                  avgRating: 4.3,
                  ratingChange: 0.2,
                },
                positiveKeywords: [
                  {
                    keyword: "친절",
                    count: 5,
                    example: "사장님이 정말 친절하세요",
                  },
                  {
                    keyword: "빠른 배달",
                    count: 3,
                    example: "주문하고 20분만에 도착했어요",
                  },
                  {
                    keyword: "양 많음",
                    count: 2,
                    example: "양이 정말 많아서 좋아요",
                  },
                ],
                negativeKeywords: [
                  {
                    keyword: "늦은 배달",
                    count: 1,
                    example: "1시간이나 걸렸어요",
                  },
                  {
                    keyword: "포장",
                    count: 1,
                    example: "포장이 뜯어져서 왔어요",
                  },
                ],
                trends: [
                  {
                    type: "improving",
                    description: "배달 속도 관련 긍정 언급 30% 증가",
                  },
                  {
                    type: "declining",
                    description: "포장 불만 2주 연속 발생",
                  },
                  {
                    type: "new",
                    description: "'양 많음' 키워드 이번 주 첫 등장",
                  },
                ],
                actions: [
                  {
                    priority: 1,
                    action: "포장 용기 점검",
                    reason: "포장 관련 불만이 2주 연속 발생 중",
                    expectedImpact: "부정 리뷰 50% 감소 예상",
                  },
                  {
                    priority: 2,
                    action: "'양 많음' 마케팅 활용",
                    reason: "새로운 긍정 키워드 발견",
                    expectedImpact: "신규 고객 유입 증가",
                  },
                ],
                marketingPoints: [
                  {
                    keyword: "친절한 서비스",
                    suggestion:
                      "리뷰에서 가장 많이 언급된 키워드예요. SNS에 '친절한 서비스'를 강조해보세요.",
                  },
                  {
                    keyword: "양 많음",
                    suggestion:
                      "배달앱 메뉴 설명에 '푸짐한 양'을 추가하면 클릭률이 올라갈 수 있어요.",
                  },
                ],
              }}
              reportDate="3/31~4/6"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
