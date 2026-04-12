// Phase 3.2 — Shared stat card primitives
// Extracted from operations-client.tsx to reduce file size and enable reuse.

export type StatTone = "indigo" | "emerald" | "amber" | "rose" | "cyan";

export const TONE_CLASSES: Record<StatTone, string> = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

export function AiStatCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: StatTone;
}) {
  return (
    <div className={`rounded-lg p-4 ring-1 ${TONE_CLASSES[tone]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">
        {value}
        {unit && <span className="ml-0.5 text-sm font-semibold">{unit}</span>}
      </p>
    </div>
  );
}

export function HyphenStatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: StatTone;
}) {
  return (
    <div className={`rounded-lg p-3 ring-1 ${TONE_CLASSES[tone]}`}>
      <p className="text-[11px] font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-sm font-bold tracking-tight">{value}</p>
    </div>
  );
}

export function AiBreakdownCard({
  title,
  entries,
}: {
  title: string;
  entries: Record<string, number>;
}) {
  const sorted = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500">
        {title}
      </p>
      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-400">데이터 없음</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map(([name, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li
                key={name}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate font-medium text-zinc-700">
                  {name}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {count.toLocaleString()} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
