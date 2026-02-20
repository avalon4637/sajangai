"use client";

import { useState, useCallback, useRef } from "react";
import { Brain, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { KpiResult } from "@/lib/kpi/calculator";

interface AiInsightWidgetProps {
  kpiData: KpiResult | null;
  businessType?: string;
}

type WidgetState = "idle" | "loading" | "streaming" | "complete" | "error";

/**
 * Render basic markdown to JSX elements.
 * Supports: **bold**, ### headings, - bullet points, line breaks.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="font-semibold text-base mt-3 mb-1">
          {processInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={i} className="font-semibold text-base mt-3 mb-1">
          {processInline(line.slice(3))}
        </h3>
      );
      continue;
    }

    // Bullet points
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(<li key={i}>{processInline(line.slice(2))}</li>);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Regular text
    flushList();
    elements.push(
      <p key={i} className="leading-relaxed">
        {processInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}

/**
 * Process inline markdown: **bold**
 */
function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}

export function AiInsightWidget({
  kpiData,
  businessType,
}: AiInsightWidgetProps) {
  const [state, setState] = useState<WidgetState>("idle");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(async () => {
    if (!kpiData) return;

    // Abort any ongoing request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState("loading");
    setText("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kpiData, businessType }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`API 오류 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다.");
      }

      const decoder = new TextDecoder();
      setState("streaming");
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setText(accumulated);
      }

      setState("complete");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    }
  }, [kpiData, businessType]);

  const hasData = kpiData !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-100">
            <Brain className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">AI 경영 분석</CardTitle>
            <CardDescription>
              AI가 경영 지표를 분석하여 인사이트를 제공합니다
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              데이터를 먼저 입력해주세요.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              매출/비용 데이터가 있어야 AI 분석이 가능합니다.
            </p>
          </div>
        ) : state === "idle" ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              현재 경영 지표를 기반으로 AI가 맞춤 분석을 제공합니다.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              매출총이익률, 인건비 비율, 생존 점수 등을 종합 분석합니다.
            </p>
          </div>
        ) : state === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <span className="text-sm text-muted-foreground">분석 중...</span>
          </div>
        ) : state === "error" ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">
              분석 중 오류가 발생했습니다
            </p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none space-y-2 text-sm">
            {renderMarkdown(text)}
            {state === "streaming" && (
              <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        {!hasData ? (
          <Button disabled className="w-full" variant="outline">
            AI 분석 시작
          </Button>
        ) : state === "idle" ? (
          <Button onClick={startAnalysis} className="w-full">
            <Brain className="h-4 w-4" />
            AI 분석 시작
          </Button>
        ) : state === "loading" || state === "streaming" ? (
          <Button disabled className="w-full" variant="outline">
            <Loader2 className="h-4 w-4 animate-spin" />
            분석 중...
          </Button>
        ) : state === "complete" ? (
          <Button
            onClick={startAnalysis}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            다시 분석
          </Button>
        ) : (
          <Button
            onClick={startAnalysis}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
