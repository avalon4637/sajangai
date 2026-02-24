"use client";

import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/database";

type SyncLog = Tables<"sync_logs">;

interface SyncHistoryProps {
  logs: SyncLog[];
}

const SYNC_TYPE_LABELS = {
  card_sales: "카드매출",
  delivery: "배달앱",
} as const;

const STATUS_CONFIG = {
  pending: {
    label: "대기",
    variant: "secondary" as const,
    icon: Clock,
  },
  running: {
    label: "진행 중",
    variant: "default" as const,
    icon: Loader2,
  },
  completed: {
    label: "완료",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  failed: {
    label: "실패",
    variant: "destructive" as const,
    icon: XCircle,
  },
} as const;

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffSec = Math.round((end - start) / 1000);
  if (diffSec < 60) return `${diffSec}초`;
  return `${Math.floor(diffSec / 60)}분 ${diffSec % 60}초`;
}

export function SyncHistory({ logs }: SyncHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        동기화 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>유형</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">건수</TableHead>
            <TableHead>시작</TableHead>
            <TableHead>소요시간</TableHead>
            <TableHead>오류</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const config = STATUS_CONFIG[log.status];
            const StatusIcon = config.icon;
            return (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {SYNC_TYPE_LABELS[log.sync_type]}
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="gap-1">
                    <StatusIcon
                      className={`size-3 ${log.status === "running" ? "animate-spin" : ""}`}
                    />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {log.records_count.toLocaleString("ko-KR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(log.started_at)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(log.started_at, log.completed_at)}
                </TableCell>
                <TableCell>
                  {log.error_message ? (
                    <span className="text-xs text-destructive">
                      {log.error_message}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
