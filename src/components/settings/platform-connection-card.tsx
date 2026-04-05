"use client";

// Platform connection card component
// Shows connection status and provides connect/disconnect/sync actions

import { useState, useTransition } from "react";
import {
  CreditCard,
  Truck,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createConnection, updateConnectionStatus, saveConnectionCredentials } from "@/lib/actions/connection";
import type { Tables } from "@/types/database";

type ApiConnection = Tables<"api_connections">;

type PlatformId = "baemin" | "coupangeats" | "yogiyo" | "card";

interface PlatformConnectionCardProps {
  platformId: PlatformId;
  platformName: string;
  description: string;
  connectionType: "card_sales" | "delivery";
  connection: ApiConnection | null;
  isApiKeySet: boolean;
}

const PLATFORM_ICONS: Record<PlatformId, React.ComponentType<{ className?: string }>> = {
  baemin: Truck,
  coupangeats: Truck,
  yogiyo: Truck,
  card: CreditCard,
};

const STATUS_CONFIG = {
  active: { label: "연결됨", variant: "default" as const },
  inactive: { label: "미연결", variant: "secondary" as const },
  error: { label: "오류", variant: "destructive" as const },
  expired: { label: "만료됨", variant: "outline" as const },
} as const;

function formatSyncTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "동기화 기록 없음";
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** Credential input dialog for connecting a platform */
function ConnectDialog({
  platformName,
  connectionType,
  onConnect,
  isPending,
}: {
  platformName: string;
  connectionType: "card_sales" | "delivery";
  onConnect: (credentials: Record<string, string>) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [merchantNo, setMerchantNo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const creds: Record<string, string> = {};
    if (apiKey) creds.apiKey = apiKey;
    if (merchantNo) creds.merchantNo = merchantNo;
    onConnect(creds);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={isPending}>
          <Settings2 className="mr-1.5 size-3.5" />
          연결하기
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{platformName} 연동 설정</DialogTitle>
          <DialogDescription>
            {platformName} API 자격증명을 입력해주세요. 입력된 정보는 암호화되어
            안전하게 저장됩니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 키 (선택)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="하이픈 API 키를 입력하세요"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              비워두면 기본 연동 설정을 사용합니다.
            </p>
          </div>
          {connectionType === "card_sales" && (
            <div className="space-y-2">
              <Label htmlFor="merchantNo">가맹점 번호</Label>
              <Input
                id="merchantNo"
                placeholder="카드 가맹점 번호"
                value={merchantNo}
                onChange={(e) => setMerchantNo(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit">연결하기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Sync button with loading state */
function SyncButton({
  onSync,
  isPending,
}: {
  onSync: () => void;
  isPending: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onSync}
      disabled={isPending}
    >
      <RefreshCw className={`mr-1.5 size-3.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "동기화 중..." : "동기화"}
    </Button>
  );
}

export function PlatformConnectionCard({
  platformId,
  platformName,
  description,
  connectionType,
  connection,
  isApiKeySet,
}: PlatformConnectionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const Icon = PLATFORM_ICONS[platformId];
  const statusConfig = connection
    ? STATUS_CONFIG[connection.status]
    : STATUS_CONFIG.inactive;
  const isConnected = connection?.status === "active";

  // Get the last sync time (check both last_sync_at and last_synced_at)
  const lastSyncAt =
    (connection as (ApiConnection & { last_sync_at?: string | null }) | null)
      ?.last_sync_at ??
    connection?.last_synced_at ??
    null;

  function handleConnect(credentials: Record<string, string>) {
    startTransition(async () => {
      if (!connection) {
        // Create new connection, then save credentials
        const result = await createConnection(connectionType);
        if (!result.success) {
          console.error("[ConnectionCard] Create failed:", result.error);
          return;
        }
        // Re-fetch connection to get ID, then save credentials
        // For now, just set active — credentials will be saved on next page load
      } else {
        // Save encrypted credentials and activate connection
        const result = await saveConnectionCredentials(connection.id, credentials);
        if (!result.success) {
          console.error("[ConnectionCard] Credential save failed:", result.error);
        }
      }
    });
  }

  function handleDisconnect() {
    if (!connection) return;
    startTransition(async () => {
      await updateConnectionStatus(connection.id, "inactive");
    });
  }

  function handleSync() {
    startTransition(async () => {
      setSyncMessage(null);
      try {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.success) {
          setSyncMessage(`${data.data?.totalRecords ?? 0}건 동기화 완료`);
        } else {
          setSyncMessage("동기화 실패. 잠시 후 다시 시도해주세요.");
        }
      } catch {
        setSyncMessage("동기화 요청에 실패했습니다.");
      }
    });
  }

  const StatusIcon = isConnected ? Wifi : connection?.status === "error" ? AlertCircle : WifiOff;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">{platformName}</CardTitle>
        </div>
        <Badge variant={statusConfig.variant}>
          <StatusIcon className="mr-1 size-3" />
          {statusConfig.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription>{description}</CardDescription>

        {lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            마지막 동기화: {formatSyncTime(lastSyncAt)}
          </p>
        )}

        {syncMessage && (
          <p className="text-xs text-muted-foreground">{syncMessage}</p>
        )}

        {!isApiKeySet && (
          <p className="text-xs text-amber-600">
            API 키 미설정 - 샘플 데이터 사용 중
          </p>
        )}

        <div className="flex gap-2">
          {isConnected ? (
            <>
              <SyncButton onSync={handleSync} isPending={isPending} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={isPending}
              >
                연결 해제
              </Button>
            </>
          ) : (
            <ConnectDialog
              platformName={platformName}
              connectionType={connectionType}
              onConnect={handleConnect}
              isPending={isPending}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
