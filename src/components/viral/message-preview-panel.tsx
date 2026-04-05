"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Send, Pencil, CalendarClock, Zap, MessageSquare } from "lucide-react";
import type { CustomerRisk } from "./customer-risk-list";

interface MessagePreviewPanelProps {
  selectedCustomer: CustomerRisk | null;
}

// Mock message templates per channel
const MESSAGE_TEMPLATES: Record<string, Record<string, string>> = {
  kakao: {
    critical:
      "[사장님AI] {name}님, 오랜만이에요! 지난번 주문하신 메뉴가 그리우실 것 같아 특별 쿠폰을 준비했어요. 7일 내 방문 시 15% 할인! 다시 만나뵙고 싶어요 :)",
    warning:
      "[사장님AI] {name}님 안녕하세요! 요즘 저희 매장에 새 메뉴가 추가되었어요. 다음 방문 시 신메뉴 10% 할인 혜택을 드릴게요!",
    watching:
      "[사장님AI] {name}님, 항상 감사합니다! 이번 주 특별 프로모션이 진행 중이에요. 확인해보세요!",
  },
  sms: {
    critical:
      "[사장님AI] {name}님 오랜만이에요! 특별 재방문 쿠폰 15% 할인 보내드립니다. 유효기간: 7일",
    warning:
      "[사장님AI] {name}님 새 메뉴 출시! 다음 방문 시 10% 할인. 기간 한정!",
    watching: "[사장님AI] {name}님 이번 주 특별 프로모션 안내드립니다.",
  },
  push: {
    critical: "{name}님, 15% 특별 할인 쿠폰이 도착했어요! 7일 내 사용 가능",
    warning: "{name}님, 새 메뉴가 나왔어요! 10% 할인으로 만나보세요",
    watching: "{name}님, 이번 주 특별 혜택을 확인해보세요!",
  },
};

// Mock estimated performance
const ESTIMATED_PERFORMANCE: Record<
  string,
  { openRate: number; visitRate: number }
> = {
  kakao: { openRate: 72, visitRate: 23 },
  sms: { openRate: 45, visitRate: 12 },
  push: { openRate: 58, visitRate: 18 },
};

/**
 * Message preview panel with channel tabs (KakaoTalk, SMS, Push).
 * Shows a simulated phone frame with message content and estimated performance.
 */
export function MessagePreviewPanel({
  selectedCustomer,
}: MessagePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState("kakao");

  if (!selectedCustomer) {
    return (
      <div className="rounded-xl border bg-card h-full flex flex-col">
        <div className="flex items-center gap-2 px-5 py-3 border-b">
          <div className="size-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <Zap className="size-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="font-semibold text-sm">바이럴 추천 메시지</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <MessageSquare className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              고객을 선택하면 추천 메시지가 표시됩니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  const riskLevel = selectedCustomer.riskLevel;
  const messageKey = riskLevel === "watching" ? "watching" : riskLevel;
  const message = MESSAGE_TEMPLATES[activeTab]?.[messageKey]?.replace(
    "{name}",
    selectedCustomer.name
  );
  const perf = ESTIMATED_PERFORMANCE[activeTab];

  return (
    <div className="rounded-xl border bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b">
        <div className="size-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <Zap className="size-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="font-semibold text-sm">바이럴 추천 메시지</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Selected customer */}
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">
            {selectedCustomer.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{selectedCustomer.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedCustomer.platform} / {selectedCustomer.daysSinceVisit}일
              미방문
            </p>
          </div>
        </div>

        {/* Channel tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="kakao" className="flex-1 text-xs">
              카카오 알림톡
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex-1 text-xs">
              문자 (SMS)
            </TabsTrigger>
            <TabsTrigger value="push" className="flex-1 text-xs">
              앱 푸시
            </TabsTrigger>
          </TabsList>

          {/* Preview box - simulated phone frame */}
          <TabsContent value={activeTab} className="mt-3">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/50 p-4">
              {/* KakaoTalk style bubble */}
              {activeTab === "kakao" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-8 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-yellow-900">
                      AI
                    </div>
                    <span className="text-xs font-medium text-foreground/70">
                      사장님AI
                    </span>
                  </div>
                  <div className="ml-10 rounded-lg bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm leading-relaxed shadow-sm max-w-[90%]">
                    {message}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-white dark:bg-slate-700 px-3.5 py-2.5 text-sm leading-relaxed shadow-sm">
                  {message}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Estimated performance */}
        {perf && (
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                {perf.openRate}%
              </p>
              <p className="text-[11px] text-violet-600/70 dark:text-violet-400/70">
                예상 오픈율
              </p>
            </div>
            <div className="flex-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 px-3 py-2.5 text-center">
              <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                {perf.visitRate}%
              </p>
              <p className="text-[11px] text-violet-600/70 dark:text-violet-400/70">
                예상 방문율
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            size="sm"
          >
            <Send className="size-3.5" />
            지금 발송하기
          </Button>
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" />
            내용 수정
          </Button>
          <Button variant="ghost" size="sm">
            <CalendarClock className="size-3.5" />
            예약 발송
          </Button>
        </div>
      </div>
    </div>
  );
}
