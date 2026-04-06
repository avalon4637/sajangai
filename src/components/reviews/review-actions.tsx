"use client";

// Review action buttons: Copy AI reply + Open platform review page
// Used in the review detail panel for quick reply workflow

import { useState, useCallback } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getReplyPageUrl,
  getPlatformLabel,
} from "@/lib/reviews/platform-links";

interface ReviewActionsProps {
  /** AI-generated reply text to copy */
  aiReply: string | null;
  /** Platform identifier for deep link */
  platform: string;
  /** Optional className for wrapper */
  className?: string;
}

export function ReviewActions({
  aiReply,
  platform,
  className,
}: ReviewActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!aiReply) return;

    try {
      await navigator.clipboard.writeText(aiReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available (insecure context or unsupported browser)
      alert("복사 기능을 사용할 수 없습니다. HTTPS 환경에서 다시 시도해주세요.");
    }
  }, [aiReply]);

  const replyUrl = getReplyPageUrl(platform);
  const platformLabel = getPlatformLabel(platform);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {/* Copy reply button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={!aiReply}
        className={`gap-1.5 transition-colors ${
          copied
            ? "border-green-300 text-green-700 bg-green-50"
            : "border-amber-300 text-amber-700 hover:bg-amber-50"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            복사됨!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            답글 복사
          </>
        )}
      </Button>

      {/* Open platform review page button */}
      <Button
        variant="outline"
        size="sm"
        asChild
        className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
      >
        <a href={replyUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3.5 w-3.5" />
          {platformLabel}에서 답글 쓰기
        </a>
      </Button>
    </div>
  );
}
