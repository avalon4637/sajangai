"use client";

import { Button } from "@/components/ui/button";
import { Send, Eye, Clock } from "lucide-react";

type AgentType = "jeongjang" | "seri" | "dapjangi" | "viral";
type MessageType = "briefing" | "alert" | "insight" | "text";
type Severity = "critical" | "warning" | "info" | "success";

interface ActionButton {
  label: string;
  variant: "primary" | "secondary" | "ghost";
  icon?: "send" | "eye" | "clock";
  action?: string;
}

interface KpiItem {
  label: string;
  value: string;
  delta?: string;
  deltaColor?: "green" | "red";
}

export interface ChatMessageData {
  id: string;
  agent: AgentType;
  type: MessageType;
  severity?: Severity;
  time: string;
  content: string;
  kpis?: KpiItem[];
  actions?: ActionButton[];
}

const AGENT_CONFIG: Record<
  AgentType,
  { name: string; emoji: string; color: string; bgColor: string }
> = {
  jeongjang: {
    name: "점장",
    emoji: "👨‍💼",
    color: "bg-[#4B6BF5]",
    bgColor: "text-[#4B6BF5]",
  },
  seri: {
    name: "세리",
    emoji: "📊",
    color: "bg-[#10B981]",
    bgColor: "text-[#059669]",
  },
  dapjangi: {
    name: "답장이",
    emoji: "⭐",
    color: "bg-[#F59E0B]",
    bgColor: "text-[#B45309]",
  },
  viral: {
    name: "바이럴",
    emoji: "📢",
    color: "bg-[#EF4444]",
    bgColor: "text-[#DC2626]",
  },
};

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "border-[#FECACA]",
  warning: "border-[#FDE68A]",
  info: "border-border",
  success: "border-[#A7F3D0]",
};

const ICON_MAP = {
  send: Send,
  eye: Eye,
  clock: Clock,
};

interface ChatMessageProps {
  message: ChatMessageData;
  onAction?: (action: string) => void;
}

export function ChatMessage({ message, onAction }: ChatMessageProps) {
  const agent = AGENT_CONFIG[message.agent];

  return (
    <div className="flex gap-2.5 items-start">
      <div
        className={`shrink-0 flex size-9 items-center justify-center rounded-full ${agent.color}`}
      >
        <span className="text-base">{agent.emoji}</span>
      </div>
      <div className="min-w-0 max-w-[85vw] sm:max-w-[620px] space-y-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[13px] font-semibold ${agent.bgColor}`}>
            {agent.name}
          </span>
          {message.severity === "critical" && (
            <span className="rounded bg-[#FEF2F2] px-1.5 py-0.5 text-[10px] font-semibold text-[#DC2626]">
              긴급
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {message.time}
          </span>
        </div>

        {message.type === "briefing" ? (
          <BriefingCard message={message} />
        ) : (
          <ActionCard message={message} onAction={onAction} />
        )}
      </div>
    </div>
  );
}

function BriefingCard({ message }: { message: ChatMessageData }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#334155] p-5 space-y-3">
      <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
        <span>📋</span>
        <span>오늘의 아침 브리핑</span>
      </div>
      <p className="text-[14px] leading-[1.7] text-[#E2E8F0]">
        {message.content}
      </p>
      {message.kpis && (
        <div className="flex gap-3">
          {message.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex-1 rounded-lg border border-[#475569] bg-[#1E293B] p-2.5 text-center"
            >
              <p className="text-[10px] text-[#94A3B8]">{kpi.label}</p>
              <p className="text-base font-bold text-white">{kpi.value}</p>
              {kpi.delta && (
                <p
                  className={`text-[10px] ${kpi.deltaColor === "red" ? "text-[#F87171]" : "text-[#34D399]"}`}
                >
                  {kpi.delta}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({
  message,
  onAction,
}: {
  message: ChatMessageData;
  onAction?: (action: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 space-y-2.5 ${SEVERITY_STYLES[message.severity ?? "info"]}`}
    >
      <p className="text-[14px] leading-[1.6]">{message.content}</p>
      {message.actions && (
        <div className="flex gap-2">
          {message.actions.map((btn) => {
            const Icon = btn.icon ? ICON_MAP[btn.icon] : null;
            if (btn.variant === "primary") {
              return (
                <Button
                  key={btn.label}
                  size="sm"
                  className="gap-1.5 bg-[#4B6BF5] hover:bg-[#3B5BD5]"
                  onClick={() => onAction?.(btn.action ?? btn.label)}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {btn.label}
                </Button>
              );
            }
            if (btn.variant === "secondary") {
              return (
                <Button
                  key={btn.label}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => onAction?.(btn.action ?? btn.label)}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {btn.label}
                </Button>
              );
            }
            return (
              <Button
                key={btn.label}
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => onAction?.(btn.action ?? btn.label)}
              >
                {btn.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
