"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateNotificationPreferences } from "@/lib/actions/notification";
import type { NotificationPreferences } from "@/lib/messaging/notification-preferences";

interface NotificationSettingsProps {
  initialPreferences: NotificationPreferences;
}

// Notification toggle items displayed in the UI
const NOTIFICATION_ITEMS = [
  {
    key: "dailyReport" as const,
    label: "일간 매출 리포트",
    description: "매일 아침 전날 매출 요약을 알려드려요",
  },
  {
    key: "reviewAlert" as const,
    label: "새 리뷰 알림",
    description: "부정적 리뷰(1-2점) 접수 시 즉시 알림",
  },
  {
    key: "anomalyAlert" as const,
    label: "이상 감지 알림",
    description: "매출 급등/급락, 자금 부족 경고",
  },
  {
    key: "weeklyReport" as const,
    label: "주간 리포트",
    description: "매주 월요일 주간 성과 요약",
  },
  {
    key: "insightAlert" as const,
    label: "AI 인사이트 알림",
    description: "중요 인사이트 발견 시 알림",
  },
  {
    key: "subscriptionAlert" as const,
    label: "구독/결제 알림",
    description: "구독 시작, 만료 예정, 결제 실패 안내",
  },
] as const;

// Hour options for quiet hours select
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return { value: `${h}:00`, label: `${h}:00` };
});

export function NotificationSettings({
  initialPreferences,
}: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleTimeChange(
    key: "quietHoursStart" | "quietHoursEnd",
    value: string
  ) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPreferences(prefs);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  const allEnabled = NOTIFICATION_ITEMS.every(
    (item) => prefs[item.key] === true
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-[#4B6BF5]" />
              <CardTitle className="text-base">카카오톡 알림 설정</CardTitle>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                const newVal = !allEnabled;
                for (const item of NOTIFICATION_ITEMS) {
                  setPrefs((prev) => ({ ...prev, [item.key]: newVal }));
                }
                setSaved(false);
              }}
            >
              {allEnabled ? "전체 해제" : "전체 켜기"}
            </button>
          </div>
          <CardDescription>
            카카오톡 알림톡으로 받을 알림을 선택하세요. 알림톡 발송이
            불가한 경우 SMS로 대체 발송됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-2"
            >
              <div className="space-y-0.5">
                <Label
                  htmlFor={`switch-${item.key}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <Switch
                id={`switch-${item.key}`}
                checked={prefs[item.key] as boolean}
                onCheckedChange={(checked) => handleToggle(item.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellOff className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">방해금지 시간</CardTitle>
          </div>
          <CardDescription>
            설정한 시간에는 알림을 보내지 않습니다. 구독/결제 관련 알림은
            방해금지 시간에도 발송됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Clock className="size-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2">
              <Select
                value={prefs.quietHoursStart}
                onValueChange={(v) => handleTimeChange("quietHoursStart", v)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((opt) => (
                    <SelectItem key={`start-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">~</span>
              <Select
                value={prefs.quietHoursEnd}
                onValueChange={(v) => handleTimeChange("quietHoursEnd", v)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((opt) => (
                    <SelectItem key={`end-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            기본값: 22:00 ~ 08:00 (밤 10시 ~ 아침 8시)
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "저장 중..." : "설정 저장"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">
            저장되었습니다.
          </span>
        )}
      </div>
    </div>
  );
}
