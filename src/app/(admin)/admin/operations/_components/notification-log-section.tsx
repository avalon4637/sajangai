// Phase 3.2 — Notification log section (extracted from operations-client.tsx)

export interface NotificationLogEntry {
  id: string;
  businessId: string;
  businessName: string;
  summary: string;
  createdAt: string;
  templateId: string;
  channel: string;
  success: boolean;
  error: string | null;
}

export function NotificationLogSection({
  logs,
}: {
  logs: NotificationLogEntry[];
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-zinc-900">알림 발송 이력</h2>
        <span className="text-xs text-zinc-500">최근 7일</span>
      </div>
      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-400">
            최근 7일 동안 발송된 알림이 없습니다.
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            cron이 실행되면 여기 쌓입니다. (/api/cron/daily-briefing 08:00 KST)
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">시간</th>
                <th className="px-4 py-3 font-medium">사업장</th>
                <th className="px-4 py-3 font-medium">템플릿</th>
                <th className="px-4 py-3 font-medium">채널</th>
                <th className="px-4 py-3 font-medium">결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 1 ? "bg-zinc-50/50" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                    {new Date(log.createdAt).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.businessName}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {log.templateId || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.channel === "alimtalk"
                          ? "bg-amber-100 text-amber-700"
                          : log.channel === "sms"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {log.channel || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        ✓ 성공
                      </span>
                    ) : (
                      <span
                        className="text-xs font-semibold text-rose-700"
                        title={log.error ?? undefined}
                      >
                        ✗ 실패
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
