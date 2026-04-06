"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageRenderer } from "@/components/chat/chat-message-renderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatClientProps {
  businessId: string;
  businessName: string;
}

export function ChatClient({ businessId, businessName }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  // Generate a stable session ID on mount for conversation memory
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, businessId, sessionId }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            (errorBody as { error?: string }).error ?? `HTTP ${response.status}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: accumulated } : msg
            )
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "응답 중 오류가 발생했습니다.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: `오류: ${errorMessage}` }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [isStreaming, businessId, sessionId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-center size-9 rounded-full bg-[#5B21B6] text-white text-sm font-bold">
          JJ
        </div>
        <div>
          <p className="text-sm font-bold text-[#1A1A1A]">
            AI 점장
          </p>
          <p className="text-xs text-[#9CA3AF]">
            {businessName} 전담 매니저
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">안녕하세요, 사장님!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                AI 점장에게 매장 운영에 대해 물어보세요
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "요즘 장사 어때?",
                  "이번 달 매출 분석해줘",
                  "리뷰 상황 알려줘",
                  "비용 줄일 곳 있어?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="text-left p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition-colors text-sm cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-3"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 flex items-start">
                <div className="flex items-center justify-center size-8 rounded-full bg-[#5B21B6] text-white text-xs font-bold">
                  JJ
                </div>
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#2563EB] text-white rounded-br-sm whitespace-pre-wrap"
                  : "bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-bl-sm"
              }`}
            >
              <ChatMessageRenderer content={msg.content} role={msg.role} />
              {msg.role === "assistant" && !msg.content && isStreaming && (
                <span className="inline-flex items-center gap-1 text-[#9CA3AF]">
                  <Loader2 className="size-3 animate-spin" />
                  생각 중...
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t bg-white px-6 py-4"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isStreaming}
          className="flex-1 rounded-full bg-[#F6F7F8] px-4 py-3 text-sm outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#2563EB]/30 disabled:opacity-50"
          aria-label="채팅 메시지 입력"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isStreaming || !input.trim()}
          className="size-10 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50"
        >
          {isStreaming ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>
    </>
  );
}
