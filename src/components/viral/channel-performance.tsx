"use client";

import { BarChart2 } from "lucide-react";

interface ChannelData {
  name: string;
  percentage: number;
  color: string;
}

interface ChannelPerformanceProps {
  channels?: ChannelData[];
}

// Default mock data for channel breakdown
const DEFAULT_CHANNELS: ChannelData[] = [
  { name: "배민", percentage: 42, color: "bg-sky-500" },
  { name: "쿠팡이츠", percentage: 28, color: "bg-emerald-500" },
  { name: "요기요", percentage: 18, color: "bg-rose-500" },
  { name: "카드", percentage: 12, color: "bg-amber-500" },
];

/**
 * Horizontal bar chart showing platform breakdown.
 * Uses Tailwind-based bars (no Recharts).
 */
export function ChannelPerformance({
  channels = DEFAULT_CHANNELS,
}: ChannelPerformanceProps) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 px-5 py-3 border-b">
        <BarChart2 className="size-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">채널별 유입 비율</h3>
      </div>
      <div className="p-5 space-y-3">
        {channels.map((channel) => (
          <div key={channel.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground/80">
                {channel.name}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {channel.percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${channel.color} transition-all duration-500`}
                style={{ width: `${channel.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
