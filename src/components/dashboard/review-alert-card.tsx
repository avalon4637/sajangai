"use client";

import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReviewAlertCardProps {
  platform: string;
  rating: number;
  preview: string;
}

export function ReviewAlertCard({
  platform,
  rating,
  preview,
}: ReviewAlertCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {platform}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
              ))}
            </div>
          </div>
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {preview}
          </p>
          <Link href="/review">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs text-amber-700"
            >
              AI 답글 확인하기 <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
