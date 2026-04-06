"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as PortOne from "@portone/browser-sdk/v2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Subscription, Payment } from "@/lib/billing/subscription";

interface BillingPageClientProps {
  subscription: (Subscription & { daysRemaining: number }) | null;
  payments: Payment[];
  businessId: string | null;
  userEmail: string;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "trial":
      return "무료 체험 중";
    case "active":
      return "점장 고용 중";
    case "cancelled":
      return "취소됨 (기간 종료까지 사용 가능)";
    case "past_due":
      return "결제 실패";
    case "expired":
      return "만료됨";
    default:
      return status;
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "결제 완료";
    case "pending":
      return "처리 중";
    case "failed":
      return "실패";
    case "refunded":
      return "환불됨";
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

export function BillingPageClient({
  subscription,
  payments,
  businessId,
  userEmail,
}: BillingPageClientProps) {
  const router = useRouter();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTrialActive = subscription?.status === "trial";
  const isActive = subscription?.status === "active";
  const isCancelled = subscription?.status === "cancelled";
  const isExpiredOrDue =
    !subscription ||
    subscription.status === "expired" ||
    subscription.status === "past_due";

  // @MX:ANCHOR: Payment flow entry point — PortOne browser SDK handles card tokenization
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
      // Card info goes directly to PG provider (not our server)
      const response = await PortOne.requestIssueBillingKey({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        billingKeyMethod: "CARD",
        issueName: "sajang.ai 정기결제 등록",
        customer: {
          customerId: businessId,
          email: userEmail,
        },
      });

      // Step 2: Check for errors (user cancelled or PG failure)
      if (!response || response.code !== undefined) {
        const msg =
          response?.code === "USER_CANCELLED"
            ? null // User cancelled — no error message needed
            : response?.message ?? "카드 등록에 실패했습니다.";
        if (msg) setError(msg);
        return;
      }

      // Step 3: Send billingKey to our server (NOT card info)
      const subscribeResponse = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey: response.billingKey }),
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

      setShowCancelConfirm(false);
      router.refresh();
    } catch (err) {
      console.error("[Billing] Subscription cancellation failed:", err);
      setError("취소 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current plan status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">현재 요금제</CardTitle>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    isActive
                      ? "default"
                      : isTrialActive
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-sm px-3 py-1"
                >
                  {getStatusLabel(subscription.status)}
                </Badge>
                {(isTrialActive || isActive || isCancelled) &&
                  subscription.daysRemaining > 0 && (
                    <span className="text-sm text-gray-500">
                      {isTrialActive
                        ? `체험 기간 ${subscription.daysRemaining}일 남음`
                        : `${subscription.daysRemaining}일 남음`}
                    </span>
                  )}
              </div>

              {isTrialActive && (
                <p className="text-sm text-gray-600">
                  무료 체험 기간:{" "}
                  <span className="font-medium">
                    {formatDate(subscription.trialEndsAt)} 까지
                  </span>
                </p>
              )}

              {(isActive || isCancelled) && (
                <p className="text-sm text-gray-600">
                  다음 결제일:{" "}
                  <span className="font-medium">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">구독 정보가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free trial plan */}
        <Card
          className={`border-2 ${isTrialActive ? "border-blue-500" : "border-gray-200"}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">무료 체험</CardTitle>
              {isTrialActive && (
                <Badge variant="secondary" className="text-xs">
                  현재 요금제
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold">
              0원{" "}
              <span className="text-sm font-normal text-gray-500">/ 7일</span>
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-gray-400">&#x2022;</span>
                데이터 수집 주 1회
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">&#x2022;</span>
                AI 분석 제한적 제공
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">&#x2022;</span>
                기본 대시보드 이용
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Paid plan */}
        <Card
          className={`border-2 ${isActive || isCancelled ? "border-green-500" : "border-gray-200"}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">점장 고용</CardTitle>
              {isActive && (
                <Badge className="text-xs bg-green-500">현재 요금제</Badge>
              )}
            </div>
            <p className="text-2xl font-bold">
              9,900원{" "}
              <span className="text-sm font-normal text-gray-500">
                / 월 (하루 330원)
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#x2713;</span>
                데이터 수집 하루 5회
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#x2713;</span>
                AI 분석 무제한
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#x2713;</span>
                전체 에이전트 팀 이용 (점장, 세리, 답장이, 바이럴)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">&#x2713;</span>
                일간 리포트 & 카카오 알림
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        {(isTrialActive || isExpiredOrDue) && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "점장 고용하기 — 월 9,900원"}
          </Button>
        )}

        {isActive && !showCancelConfirm && (
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowCancelConfirm(true)}
          >
            구독 취소
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </p>
      )}

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700 mb-4">
              정말 구독을 취소하시겠습니까?{" "}
              <span className="font-medium">
                {formatDate(subscription?.currentPeriodEnd ?? null)} 까지는 계속 이용할
                수 있습니다.
              </span>
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "처리 중..." : "구독 취소 확인"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setError(null);
                }}
                disabled={isLoading}
              >
                돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">결제 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {payment.amount.toLocaleString("ko-KR")}원
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </p>
                    {payment.failedReason && (
                      <p className="text-xs text-red-500 mt-0.5">
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
                    className="text-xs"
                  >
                    {getPaymentStatusLabel(payment.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
