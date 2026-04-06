"use client";

import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BusinessListProps {
  businesses: { id: string; name: string }[];
  currentBusinessId?: string;
}

export function BusinessList({ businesses, currentBusinessId }: BusinessListProps) {
  if (businesses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        등록된 사업장이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {businesses.map((biz) => {
        const isCurrent = biz.id === currentBusinessId;
        return (
          <li
            key={biz.id}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              isCurrent ? "border-primary bg-primary/5" : ""
            }`}
          >
            <Building2 className={`size-4 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">{biz.name}</span>
            {isCurrent && (
              <Badge variant="secondary" className="ml-auto text-xs">
                현재 선택
              </Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
}
