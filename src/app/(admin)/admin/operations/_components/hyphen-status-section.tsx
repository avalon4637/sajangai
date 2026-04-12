// Phase 3.2 — Hyphen status section (extracted from operations-client.tsx)

import { HyphenStatusCard } from "./stat-cards";

export interface HyphenStatus {
  configured: boolean;
  testMode: boolean;
  activeConnectionCount: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncType: string | null;
}

export function HyphenStatusSection({
  status,
}: {
  status: HyphenStatus;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-zinc-900">하이픈 연동 상태</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <HyphenStatusCard
          label="API 키"
          value={status.configured ? "설정됨" : "누락"}
          tone={status.configured ? "emerald" : "rose"}
        />
        <HyphenStatusCard
          label="모드"
          value={status.testMode ? "TEST" : "PROD"}
          tone={status.testMode ? "amber" : "emerald"}
        />
        <HyphenStatusCard
          label="활성 연결"
          value={`${status.activeConnectionCount}개`}
          tone={status.activeConnectionCount > 0 ? "emerald" : "rose"}
        />
        <HyphenStatusCard
          label="마지막 동기화"
          value={
            status.lastSyncAt
              ? new Date(status.lastSyncAt).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "없음"
          }
          tone={
            status.lastSyncStatus === "completed"
              ? "emerald"
              : status.lastSyncStatus === "failed"
                ? "rose"
                : "indigo"
          }
        />
      </div>
      {!status.configured && (
        <p className="mt-2 text-xs text-rose-600">
          ⚠ HYPHEN_USER_ID / HYPHEN_HKEY 환경변수를 설정해야 실제 동기화가
          가능합니다.
        </p>
      )}
      {status.testMode && status.configured && (
        <p className="mt-2 text-xs text-amber-700">
          ⚠ 현재 TEST 모드입니다. 프로덕션 데이터를 수집하려면
          HYPHEN_TEST_MODE=false로 변경하세요.
        </p>
      )}
    </section>
  );
}
