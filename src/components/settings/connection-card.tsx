"use client";

import { useTransition } from "react";
import { CreditCard, Truck, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createConnection,
  updateConnectionStatus,
  deleteConnection,
} from "@/lib/actions/connection";
import type { Tables } from "@/types/database";

type ApiConnection = Tables<"api_connections">;

interface ConnectionCardProps {
  connectionType: "card_sales" | "delivery";
  connection: ApiConnection | null;
  isApiKeySet: boolean;
}

const CONNECTION_META = {
  card_sales: {
    title: "카드매출 연동",
    description: "카드매출 데이터를 자동으로 가져옵니다.",
    icon: CreditCard,
  },
  delivery: {
    title: "배달앱 연동",
    description: "배달앱 매출 데이터를 자동으로 가져옵니다.",
    icon: Truck,
  },
} as const;

const STATUS_CONFIG = {
  active: { label: "연결됨", variant: "default" as const },
  inactive: { label: "미연결", variant: "secondary" as const },
  error: { label: "오류", variant: "destructive" as const },
  expired: { label: "만료됨", variant: "outline" as const },
} as const;

function formatLastSynced(dateStr: string | null): string {
  if (!dateStr) return "동기화 기록 없음";
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ConnectionCard({
  connectionType,
  connection,
  isApiKeySet,
}: ConnectionCardProps) {
  const [isPending, startTransition] = useTransition();
  const meta = CONNECTION_META[connectionType];
  const Icon = meta.icon;

  // Handle connect action
  function handleConnect() {
    startTransition(async () => {
      if (!connection) {
        // Create new connection then activate
        const result = await createConnection(connectionType);
        if (!result.success) {
          console.error(result.error);
        }
      } else {
        // Activate existing connection
        await updateConnectionStatus(connection.id, "active");
      }
    });
  }

  // Handle disconnect action
  function handleDisconnect() {
    if (!connection) return;
    startTransition(async () => {
      await updateConnectionStatus(connection.id, "inactive");
    });
  }

  // Handle delete action
  function handleDelete() {
    if (!connection) return;
    startTransition(async () => {
      await deleteConnection(connection.id);
    });
  }

  // API key not set state
  if (!isApiKeySet) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <Icon className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">{meta.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 rounded-md bg-muted p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">API 키를 설정해주세요</p>
              <p className="mt-1">
                하이픈 API 키가 환경변수에 설정되어 있지 않습니다.
                관리자에게 문의하여 HYPHEN_API_KEY를 설정해주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = connection
    ? STATUS_CONFIG[connection.status]
    : STATUS_CONFIG.inactive;

  const StatusIcon =
    connection?.status === "active"
      ? Wifi
      : connection?.status === "error"
        ? AlertCircle
        : WifiOff;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Icon className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">{meta.title}</CardTitle>
        </div>
        <Badge variant={statusConfig.variant}>
          <StatusIcon className="mr-1 size-3" />
          {statusConfig.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          {meta.description}
        </p>

        {connection?.last_synced_at && (
          <p className="mb-3 text-xs text-muted-foreground">
            마지막 동기화: {formatLastSynced(connection.last_synced_at)}
          </p>
        )}

        <div className="flex gap-2">
          {connection?.status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              {isPending ? "처리 중..." : "연결 해제"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={isPending}
            >
              {isPending ? "처리 중..." : "연결하기"}
            </Button>
          )}
          {connection && connection.status !== "active" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              삭제
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
