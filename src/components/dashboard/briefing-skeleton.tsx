// Briefing Skeleton Component
// Shimmer/pulse skeleton matching the daily briefing card layout

import { Card, CardContent } from "@/components/ui/card";

function Pulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
  );
}

export function BriefingSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Accent top border */}
      <div className="h-1 bg-gradient-to-r from-muted via-muted/80 to-muted/60" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 md:px-6">
        <div className="flex items-center gap-2">
          <Pulse className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-3 w-24" />
          </div>
        </div>
        <Pulse className="h-5 w-20 rounded-full" />
      </div>

      <CardContent className="space-y-4 px-4 pb-4 md:px-6">
        {/* Revenue section header */}
        <div>
          <Pulse className="mb-2 h-4 w-20" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3 text-center">
                <Pulse className="mx-auto h-3 w-12" />
                <Pulse className="mx-auto mt-2 h-5 w-16" />
              </div>
            ))}
          </div>
          <Pulse className="mt-2 h-2 w-full rounded-full" />
        </div>

        {/* Review section */}
        <div>
          <Pulse className="mb-2 h-4 w-16" />
          <Pulse className="h-12 w-full rounded-lg" />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Pulse className="h-8 flex-1 rounded-md" />
          <Pulse className="h-8 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
