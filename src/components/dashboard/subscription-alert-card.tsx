"use client";

import { CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SubscriptionAlertCardProps {
  type: "started" | "expiring" | "payment_failed";
  planName: string;
  date: string;
  nextBillingDate?: string;
  daysRemaining?: number;
  failReason?: string;
}

const configMap = {
  started: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900",
    subtitleColor: "text-emerald-600",
    btnColor: "text-emerald-700",
    Icon: CheckCircle,
    title: "구독이 시작되었습니다",
  },
  expiring: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-900",
    subtitleColor: "text-amber-600",
    btnColor: "text-amber-700",
    Icon: Clock,
    title: "구독이 곧 만료됩니다",
  },
  payment_failed: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    subtitleColor: "text-red-600",
    btnColor: "text-red-700",
    Icon: XCircle,
    title: "결제에 실패했습니다",
  },
};

export function SubscriptionAlertCard({
  type,
  planName,
  date,
  nextBillingDate,
  daysRemaining,
  failReason,
}: SubscriptionAlertCardProps): React.JSX.Element {
  const config = configMap[type];
  const { Icon } = config;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-3`}>
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${config.titleColor}`}>
            {config.title}
          </p>
          <div className="mt-1 space-y-0.5">
            <p className="text-[11px] text-slate-700">
              <span className="font-medium">{planName}</span>
              <span className="mx-1 text-muted-foreground">|</span>
              <span className="text-muted-foreground">{date}</span>
            </p>
            {type === "expiring" && daysRemaining !== undefined && (
              <p className={`text-[10px] font-medium ${config.subtitleColor}`}>
                {daysRemaining}일 남음
              </p>
            )}
            {type === "started" && nextBillingDate && (
              <p className="text-[10px] text-muted-foreground">
                다음 결제일: {nextBillingDate}
              </p>
            )}
            {type === "payment_failed" && failReason && (
              <p className="text-[10px] text-red-500">{failReason}</p>
            )}
          </div>
          <div className="mt-2">
            <Link href="/settings/subscription">
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 px-2 text-xs ${config.btnColor}`}
              >
                {type === "payment_failed" ? "결제 수단 변경" : "구독 관리"}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
