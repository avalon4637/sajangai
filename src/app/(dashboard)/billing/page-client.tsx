"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Subscription, Payment } from "@/lib/billing/subscription";

interface BillingPageClientProps {
  subscription: (Subscription & { daysRemaining: number }) | null;
  payments: Payment[];
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

// Card number input formatter
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

interface CardFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  birthOrBusiness: string;
  passwordTwo: string;
}

export function BillingPageClient({
  subscription,
  payments,
}: BillingPageClientProps) {
  const router = useRouter();
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardFormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    birthOrBusiness: "",
    passwordTwo: "",
  });

  const isTrialActive = subscription?.status === "trial";
  const isActive = subscription?.status === "active";
  const isCancelled = subscription?.status === "cancelled";
  const isExpiredOrDue =
    !subscription ||
    subscription.status === "expired" ||
    subscription.status === "past_due";

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // For MVP: call our subscribe API with a mock billing key
      // In production, this would first call PortOne to issue a billing key,
      // then pass the billing key to our API.
      // Since PortOne browser SDK setup is complex, we use a simplified flow.

      // Step 1: Issue billing key via our API (server-side)
      const issueResponse = await fetch("/api/billing/issue-billing-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: cardForm.cardNumber.replace(/-/g, ""),
          expiryMonth: cardForm.expiryMonth,
          expiryYear: cardForm.expiryYear,
          birthOrBusinessRegistrationNumber: cardForm.birthOrBusiness,
          passwordTwoDigits: cardForm.passwordTwo,
        }),
      });

      const issueData = (await issueResponse.json()) as {
        billingKey?: string;
        error?: string;
      };

      if (!issueResponse.ok || !issueData.billingKey) {
        setError(issueData.error ?? "카드 등록에 실패했습니다.");
        return;
      }

      // Step 2: Activate subscription with billing key
      const subscribeResponse = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingKey: issueData.billingKey }),
      });

      const subscribeData = (await subscribeResponse.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!subscribeResponse.ok) {
        setError(subscribeData.error ?? "구독 활성화에 실패했습니다.");
        return;
      }

      setShowCardForm(false);
      router.refresh();
    } catch (error) {
      console.error("[Billing] Payment failed:", error);
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
    } catch (error) {
      console.error("[Billing] Subscription cancellation failed:", error);
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
                <span className="text-gray-400">•</span>
                데이터 수집 주 1회
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                AI 분석 제한적 제공
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
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
                <span className="text-green-500">✓</span>
                데이터 수집 하루 5회
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                AI 분석 무제한
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                전체 에이전트 팀 이용 (점장, 세리, 답장이, 바이럴)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                일간 리포트 & 카카오 알림
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        {(isTrialActive || isExpiredOrDue) && !showCardForm && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowCardForm(true)}
          >
            점장 고용하기 — 월 9,900원
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

      {/* Card registration form */}
      {showCardForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">카드 정보 입력</CardTitle>
            <p className="text-sm text-gray-500">
              카드 정보는 안전하게 PortOne을 통해 처리됩니다.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCardSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cardNumber">카드 번호</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234-5678-9012-3456"
                  value={cardForm.cardNumber}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cardNumber: formatCardNumber(e.target.value),
                    }))
                  }
                  maxLength={19}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiryMonth">유효기간 월 (MM)</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="12"
                    value={cardForm.expiryMonth}
                    onChange={(e) =>
                      setCardForm((prev) => ({
                        ...prev,
                        expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2),
                      }))
                    }
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiryYear">유효기간 년 (YY)</Label>
                  <Input
                    id="expiryYear"
                    placeholder="28"
                    value={cardForm.expiryYear}
                    onChange={(e) =>
                      setCardForm((prev) => ({
                        ...prev,
                        expiryYear: e.target.value.replace(/\D/g, "").slice(0, 2),
                      }))
                    }
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthOrBusiness">
                  생년월일 (6자리) 또는 사업자번호 (10자리)
                </Label>
                <Input
                  id="birthOrBusiness"
                  placeholder="920101 또는 1234567890"
                  value={cardForm.birthOrBusiness}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      birthOrBusiness: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    }))
                  }
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordTwo">카드 비밀번호 앞 2자리</Label>
                <Input
                  id="passwordTwo"
                  type="password"
                  placeholder="••"
                  value={cardForm.passwordTwo}
                  onChange={(e) =>
                    setCardForm((prev) => ({
                      ...prev,
                      passwordTwo: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 2),
                    }))
                  }
                  maxLength={2}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "처리 중..." : "점장 고용하기 — 9,900원 결제"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCardForm(false);
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
                {error}
              </p>
            )}
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
