"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Paperclip, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoiKpiStrip } from "./roi-kpi-strip";
import { ChatMessage, type ChatMessageData } from "./chat-message";

interface JeongjangChatHubProps {
  businessId: string;
  businessName: string;
  initialMessages: ChatMessageData[];
  roiData?: {
    savedMoney: number;
    savedHours: number;
    processedTasks: number;
  };
}

export function JeongjangChatHub({
  businessId,
  businessName,
  initialMessages,
  roiData,
}: JeongjangChatHubProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessageData = {
      id: `user-${Date.now()}`,
      agent: "jeongjang",
      type: "text",
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          businessId,
          sessionId: crypto.randomUUID(),
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = `assistant-${Date.now()}`;

      const assistantMsg: ChatMessageData = {
        id: assistantId,
        agent: "jeongjang",
        type: "text",
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        content: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: assistantContent } : m
            )
          );
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          agent: "jeongjang",
          type: "text",
          severity: "critical",
          time: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          content: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleAction = (action: string) => {
    // Placeholder for action handling (navigate, send message, etc.)
    console.log("Action:", action);
  };

  const suggestions = [
    "오늘 매출 요약해줘",
    "이번 주 리뷰 분석해줘",
    "배달 수수료 확인해줘",
  ];

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="flex h-full flex-col">
      {roiData && <RoiKpiStrip {...roiData} />}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-[#F8F9FA] px-8 py-5 space-y-4">
        {/* Date divider */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
            {today}
          </span>
        </div>

        {messages.map((msg) => {
          if (msg.type === "text" && msg.agent === "jeongjang" && !msg.severity) {
            // Plain text from user or assistant
            const isUser = msg.id.startsWith("user-");
            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[480px] rounded-2xl rounded-br-md bg-[#4B6BF5] px-4 py-2.5 text-[14px] text-white">
                    {msg.content}
                  </div>
                </div>
              );
            }
            // Assistant text response
            return (
              <div key={msg.id} className="flex gap-2.5 items-start">
                <div className="shrink-0 flex size-9 items-center justify-center rounded-full bg-[#4B6BF5]">
                  <span className="text-base">👨‍💼</span>
                </div>
                <div className="max-w-[620px] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-[#4B6BF5]">
                      점장
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {msg.time}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white border px-4 py-3 text-[14px] leading-[1.7]">
                    {msg.content}
                    {isStreaming &&
                      msg.id === messages[messages.length - 1]?.id && (
                        <span className="ml-1 inline-block size-2 animate-pulse rounded-full bg-[#4B6BF5]" />
                      )}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              onAction={handleAction}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= initialMessages.length && (
        <div className="flex gap-2 border-t bg-white px-8 py-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="rounded-full border px-3 py-1.5 text-[12px] text-muted-foreground transition hover:border-[#4B6BF5] hover:text-[#4B6BF5] cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 border-t bg-white px-8 py-4"
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl border bg-[#F8F9FA] px-4 py-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="점장에게 물어보세요..."
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
            disabled={isStreaming}
          />
          <Paperclip className="size-[18px] shrink-0 text-muted-foreground" />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={isStreaming || !input.trim()}
          className="size-11 shrink-0 rounded-xl bg-[#4B6BF5] hover:bg-[#3B5BD5] shadow-sm"
        >
          <ArrowUp className="size-5" />
        </Button>
      </form>
    </div>
  );
}
