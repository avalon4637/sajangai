// Jeongjang Briefing Card Component
// Displays the latest daily briefing from the 점장 AI agent
// Data source: daily_reports table with report_type='jeongjang_briefing'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BriefingStructured {
  oneLiner?: string;
  revenue?: number;
  reviewCount?: number;
  negativeReviewCount?: number;
  alert?: string;
  todayAction?: string;
}

interface BriefingContent {
  narrative?: string;
  structured?: BriefingStructured;
  generatedAt?: string;
}

interface JeongjangBriefingCardProps {
  date: string;
  summary: string;
  content: Record<string, unknown> | null;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}년 ${month}월 ${day}일`;
}

function formatRevenue(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export function JeongjangBriefingCard({
  date,
  summary,
  content,
}: JeongjangBriefingCardProps) {
  const briefingContent = content as BriefingContent | null;
  const structured = briefingContent?.structured;
  const narrative = briefingContent?.narrative ?? summary;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span>👨‍💼</span>
            <span>점장 브리핑</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {formatDate(date)}
            </Badge>
            <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
              AI 분석 완료
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* One-liner summary */}
        {structured?.oneLiner && (
          <p className="text-sm font-medium text-foreground">
            {structured.oneLiner}
          </p>
        )}

        {/* Narrative text */}
        {narrative && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {narrative.length > 300 ? narrative.slice(0, 300) + "..." : narrative}
          </p>
        )}

        {/* Quick stats row */}
        {structured && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {structured.revenue !== undefined && structured.revenue > 0 && (
              <div className="bg-background rounded-md p-2 text-center">
                <div className="text-xs text-muted-foreground">어제 매출</div>
                <div className="text-sm font-semibold mt-0.5">
                  {formatRevenue(structured.revenue)}
                </div>
              </div>
            )}
            {structured.reviewCount !== undefined && structured.reviewCount > 0 && (
              <div className="bg-background rounded-md p-2 text-center">
                <div className="text-xs text-muted-foreground">리뷰</div>
                <div className="text-sm font-semibold mt-0.5">
                  {structured.reviewCount}건
                </div>
              </div>
            )}
            {structured.negativeReviewCount !== undefined && structured.negativeReviewCount > 0 && (
              <div className="bg-background rounded-md p-2 text-center">
                <div className="text-xs text-muted-foreground">부정 리뷰</div>
                <div className="text-sm font-semibold mt-0.5 text-red-600">
                  {structured.negativeReviewCount}건
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action item */}
        {structured?.todayAction && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
            <span className="text-amber-600 text-sm flex-shrink-0">💡</span>
            <p className="text-xs text-amber-800">{structured.todayAction}</p>
          </div>
        )}

        {/* Alert */}
        {structured?.alert && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3">
            <span className="text-red-600 text-sm flex-shrink-0">⚠️</span>
            <p className="text-xs text-red-800">{structured.alert}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
