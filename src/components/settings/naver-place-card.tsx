"use client";

// Naver Place connection card
// Allows users to input their Naver Place URL, save the placeId, and trigger review sync

import { useState, useTransition } from "react";
import { MapPin, RefreshCw, Check, X, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractPlaceId } from "@/lib/naver/types";

interface NaverPlaceCardProps {
  businessId: string;
  naverPlaceId: string | null;
  lastSyncedAt: string | null;
}

function formatSyncTime(dateStr: string | null): string {
  if (!dateStr) return "동기화 기록 없음";
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function NaverPlaceCard({
  businessId,
  naverPlaceId: initialPlaceId,
  lastSyncedAt,
}: NaverPlaceCardProps) {
  const [isPending, startTransition] = useTransition();
  const [placeUrl, setPlaceUrl] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(initialPlaceId);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!initialPlaceId);
  const [lastSync, setLastSync] = useState(lastSyncedAt);

  const isConnected = !!placeId;

  function handleUrlChange(value: string) {
    setPlaceUrl(value);
    setUrlError(null);

    if (value.trim()) {
      const extracted = extractPlaceId(value);
      if (!extracted) {
        setUrlError("올바른 네이버 플레이스 URL을 입력해주세요.");
      }
    }
  }

  function handleSavePlaceId() {
    const extracted = extractPlaceId(placeUrl);
    if (!extracted) {
      setUrlError("올바른 네이버 플레이스 URL을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/naver/place-id", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, placeId: extracted }),
        });

        if (response.ok) {
          setPlaceId(extracted);
          setIsEditing(false);
          setPlaceUrl("");
          setSyncMessage("네이버 플레이스가 연결되었습니다.");
        } else {
          const data = await response.json();
          setUrlError(data.error ?? "저장에 실패했습니다.");
        }
      } catch {
        setUrlError("요청에 실패했습니다.");
      }
    });
  }

  function handleRemovePlaceId() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/naver/place-id", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, placeId: null }),
        });

        if (response.ok) {
          setPlaceId(null);
          setIsEditing(true);
          setSyncMessage(null);
        }
      } catch {
        setSyncMessage("연결 해제에 실패했습니다.");
      }
    });
  }

  function handleSync() {
    startTransition(async () => {
      setSyncMessage(null);
      try {
        const response = await fetch("/api/naver/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();

        if (data.success) {
          setSyncMessage(
            data.newReviews > 0
              ? `새 리뷰 ${data.newReviews}건 수집 (총 ${data.totalReviews}건)`
              : `새 리뷰 없음 (총 ${data.totalReviews}건)`
          );
          setLastSync(new Date().toISOString());
        } else if (response.status === 429) {
          setSyncMessage("시간당 3회 제한을 초과했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          setSyncMessage(data.error ?? "동기화에 실패했습니다.");
        }
      } catch {
        setSyncMessage("동기화 요청에 실패했습니다.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-green-100">
            <MapPin className="size-4 text-green-600" />
          </div>
          <CardTitle className="text-base">네이버 플레이스</CardTitle>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? (
            <>
              <Check className="mr-1 size-3" />
              연결됨
            </>
          ) : (
            <>
              <X className="mr-1 size-3" />
              미연결
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription>
          네이버 플레이스에 등록된 매장의 리뷰를 자동으로 수집합니다.
        </CardDescription>

        {isConnected && !isEditing ? (
          // Connected state - show placeId and sync controls
          <>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Place ID:</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {placeId}
              </code>
              <a
                href={`https://m.place.naver.com/restaurant/${placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              마지막 동기화: {formatSyncTime(lastSync)}
            </p>

            {syncMessage && (
              <p className="text-xs text-muted-foreground">{syncMessage}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isPending}
              >
                <RefreshCw
                  className={`mr-1.5 size-3.5 ${isPending ? "animate-spin" : ""}`}
                />
                {isPending ? "동기화 중..." : "리뷰 수집"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePlaceId}
                disabled={isPending}
              >
                연결 해제
              </Button>
            </div>
          </>
        ) : (
          // Disconnected state - show URL input
          <>
            <div className="space-y-2">
              <Label htmlFor="naverPlaceUrl">네이버 플레이스 URL</Label>
              <Input
                id="naverPlaceUrl"
                placeholder="https://m.place.naver.com/restaurant/1234567890"
                value={placeUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isPending}
              />
              {urlError && (
                <p className="text-xs text-destructive">{urlError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                네이버 지도에서 매장을 검색한 후 URL을 붙여넣어 주세요.
              </p>
            </div>

            {syncMessage && (
              <p className="text-xs text-muted-foreground">{syncMessage}</p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSavePlaceId}
                disabled={isPending || !placeUrl.trim()}
              >
                {isPending ? "저장 중..." : "연결하기"}
              </Button>
              {initialPlaceId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  취소
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
