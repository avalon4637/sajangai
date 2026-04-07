"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as PortOne from "@portone/browser-sdk/v2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Clock,
  CreditCard,
  Check,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { Subscription, Payment } from "@/lib/billing/subscription";
import { PRICING } from "@/lib/billing/pricing";
import type { PlanInterval } from "@/lib/billing/pricing";
import { formatKRW } from "@/lib/utils/format-currency";
import type { RoiBreakdown } from "@/lib/roi/calculator";

interface BillingPageClientProps {
  subscription: (Subscription & { daysRemaining: number }) | null;
  payments: Payment[];
  businessId: string | null;
  userEmail: string;
  roi: RoiBreakdown | null;
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "완료";
    case "pending":
      return "처리 중";
    case "failed":
      return "실패";
    case "refunded":
      return "환불";
    default:
      return status;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Compute days since subscription created
function getDaysSinceStart(subscription: Subscription): number {
  const created = new Date(subscription.createdAt);
  const now = new Date();
  return Math.max(1, Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
}

export function BillingPageClient({
  subscription,
  payments,
  businessId,
  userEmail,
  roi,
}: BillingPageClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanInterval>("quarterly");

  const isTrialActive = subscription?.status === "trial";
  const isActive = subscription?.status === "active";
  const isCancelled = subscription?.status === "cancelled";
  const isExpiredOrDue =
    !subscription ||
    subscription.status === "expired" ||
    subscription.status === "past_due";

  const canSubscribe = isTrialActive || isExpiredOrDue;
  const hasRoiData = roi && roi.totalValue > 0;

  // Context-aware subtitle
  const getSubtitle = (): string => {
    if (isTrialActive && subscription) {
      return `체험 기간 ${subscription.daysRemaining}일 남음 -- 점장이 열심히 일하고 있어요`;
    }
    if (isActive && subscription) {
      const days = getDaysSinceStart(subscription);
      return `사장님의 AI 점장이 일한 지 ${days}일째`;
    }
    if (isCancelled && subscription) {
      return `${formatDate(subscription.currentPeriodEnd)}까지 이용 가능`;
    }
    return "점장이 쉬고 있어요. 다시 고용해주세요";
  };

  // Status badge config
  const getStatusBadge = (): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } | null => {
    if (!subscription) return null;
    switch (subscription.status) {
      case "trial":
        return { label: "체험 중", variant: "secondary" };
      case "active":
        return { label: "고용 중", variant: "default" };
      case "cancelled":
        return { label: "취소됨", variant: "outline" };
      case "past_due":
        return { label: "결제 실패", variant: "destructive" };
      case "expired":
        return { label: "만료", variant: "destructive" };
      default:
        return null;
    }
  };

  // @MX:ANCHOR: Payment flow entry point -- PortOne browser SDK handles card tokenization
  // @MX:REASON: Card info goes directly to PG (PCI-DSS compliant), never touches our server
  const handleSubscribe = async () => {
    if (!businessId) {
      setError("사업장 정보가 없습니다. 사업자 등록을 먼저 완료해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: PortOne browser SDK opens PG window
      const response = await PortOne.requestIssueBillingKey({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        billingKeyMethod: "CARD",
        issueName: "사장AI 정기결제 등록",
        customer: {
          customerId: businessId,
          email: userEmail,
        },
      });

      // Step 2: Check for errors (user cancelled or PG failure)
      if (!response || response.code !== undefined) {
        const msg =
          response?.code === "USER_CANCELLED"
            ? null
            : response?.message ?? "카드 등록에 실패했습니다.";
        if (msg) setError(msg);
        return;
      }

      // Step 3: Send billingKey to our server (NOT card info)
      const subscribeResponse = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey: response.billingKey, planInterval: selectedPlan }),
      });

      const subscribeData = (await subscribeResponse.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!subscribeResponse.ok) {
        setError(subscribeData.error ?? "구독 활성화에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("[Billing] Payment failed:", err);
      setError("결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "구독 취소에 실패했습니다.");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("[Billing] Subscription cancellation failed:", err);
      setError("취소 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusBadge = getStatusBadge();

  // ROI metrics for compact strip
  const hoursSaved = hasRoiData ? Math.round(roi.timeSavings / 15000) : 0;

  const selectedPricing = PRICING[selectedPlan];

  // Feature list for paid plan
  const features = [
    "데이터 수집 하루 5회",
    "AI 분석 무제한",
    "전체 에이전트 팀 이용 (점장, 세리, 답장이, 바이럴)",
    "일간 리포트 & 카카오 알림",
    "매출/리뷰 이상 감지 알림",
    "경쟁 분석 & 벤치마크",
  ];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-28 sm:pb-6">
      {/* Hero section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">점장 고용</h1>
          {statusBadge && (
            <Badge variant={statusBadge.variant} className="text-xs">
              {statusBadge.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{getSubtitle()}</p>

        {/* Next billing date for active/cancelled */}
        {(isActive || isCancelled) && subscription?.currentPeriodEnd && (
          <p className="text-xs text-muted-foreground mt-1">
            {isActive ? "다음 결제일" : "이용 만료일"}:{" "}
            <span className="font-medium text-foreground">
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </p>
        )}

        {/* Trial end date */}
        {isTrialActive && subscription?.trialEndsAt && (
          <p className="text-xs text-muted-foreground mt-1">
            체험 종료일:{" "}
            <span className="font-medium text-foreground">
              {formatDate(subscription.trialEndsAt)}
            </span>
          </p>
        )}
      </div>

      {/* ROI strip - only show if active/trial AND has data */}
      {(isTrialActive || isActive || isCancelled) && hasRoiData && (
        <div className="rounded-xl border bg-card p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-3">점장이 일한 성과</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {hoursSaved}시간
              </p>
              <p className="text-[11px] text-muted-foreground">절약한 시간</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {formatKRW(roi.feeSavings + roi.costSavings)}
              </p>
              <p className="text-[11px] text-muted-foreground">절약한 비용</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-primary">
                {roi.roiMultiple}배
              </p>
              <p className="text-[11px] text-muted-foreground">투자 대비 회수</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan selector - show when can subscribe */}
      {canSubscribe && (
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-3">결제 주기 선택</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(Object.entries(PRICING) as [PlanInterval, typeof PRICING.monthly][]).map(
              ([key, plan]) => {
                const isSelected = selectedPlan === key;
                const isPopular = key === "quarterly";
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPlan(key)}
                    className={`relative rounded-xl border-2 p-3 sm:p-4 text-center transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 whitespace-nowrap">
                        인기
                      </Badge>
                    )}
                    {plan.discount > 0 && !isPopular && (
                      <Badge
                        variant="secondary"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] px-2 whitespace-nowrap"
                      >
                        {plan.discount}% 할인
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{plan.label}</p>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                      {plan.amount.toLocaleString("ko-KR")}원
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      월 {plan.perMonth.toLocaleString("ko-KR")}원
                    </p>
                    {plan.discount > 0 && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        {plan.discount}% 절약
                      </p>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Feature list */}
      {canSubscribe && (
        <div className="rounded-xl border bg-card p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">점장 고용 시 포함</p>
          </div>
          <ul className="space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* CTA button - desktop */}
      {canSubscribe && (
        <div className="hidden sm:block mb-6">
          <Button
            size="lg"
            className="w-full text-base h-12"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              "처리 중..."
            ) : (
              <span className="flex items-center gap-2">
                점장 고용하기
                <ChevronRight className="w-4 h-4" />
                <span className="font-normal opacity-80">
                  {selectedPricing.amount.toLocaleString("ko-KR")}원
                </span>
              </span>
            )}
          </Button>
          {selectedPricing.discount > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              월 {selectedPricing.perMonth.toLocaleString("ko-KR")}원 (
              {selectedPricing.discount}% 할인 적용)
            </p>
          )}
        </div>
      )}

      {/* Cancel subscription button */}
      {isActive && (
        <div className="mb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-destructive"
              >
                구독 취소
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>점장을 해고하시겠어요?</AlertDialogTitle>
                <AlertDialogDescription>
                  {subscription?.currentPeriodEnd && (
                    <>
                      {formatDate(subscription.currentPeriodEnd)}까지는 계속 이용할 수
                      있어요. 이후에는 데이터 수집과 AI 분석이 중단됩니다.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  계속 고용하기
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isLoading ? "처리 중..." : "해고 확인"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Payment history - collapsible accordion */}
      {payments.length > 0 && (
        <Accordion type="single" collapsible className="rounded-xl border bg-card">
          <AccordionItem value="payments" className="border-none">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                결제 내역
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {payments.length}건
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {payment.amount.toLocaleString("ko-KR")}원
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.paidAt ?? payment.createdAt)}
                      </p>
                      {payment.failedReason && (
                        <p className="text-xs text-destructive mt-0.5">
                          {payment.failedReason}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        payment.status === "paid"
                          ? "default"
                          : payment.status === "refunded"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {getPaymentStatusLabel(payment.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Empty state for no payments */}
      {payments.length === 0 && !canSubscribe && (
        <div className="rounded-xl border bg-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            아직 결제 내역이 없습니다.
          </p>
        </div>
      )}

      {/* Mobile sticky CTA */}
      {canSubscribe && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-background/95 backdrop-blur-sm border-t p-4 z-50">
          <Button
            size="lg"
            className="w-full text-base h-12"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              "처리 중..."
            ) : (
              <span className="flex items-center gap-2">
                점장 고용하기
                <span className="font-normal opacity-80">
                  {selectedPricing.amount.toLocaleString("ko-KR")}원
                </span>
              </span>
            )}
          </Button>
          {selectedPricing.discount > 0 && (
            <p className="text-[11px] text-center text-muted-foreground mt-1">
              월 {selectedPricing.perMonth.toLocaleString("ko-KR")}원 ({selectedPricing.discount}% 절약)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
