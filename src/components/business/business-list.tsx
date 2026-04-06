"use client";

import { Building2 } from "lucide-react";

interface BusinessListProps {
  businesses: { id: string; name: string }[];
}

export function BusinessList({ businesses }: BusinessListProps) {
  if (businesses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        등록된 사업장이 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {businesses.map((biz) => (
        <li
          key={biz.id}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          <Building2 className="size-4 shrink-0 text-[#71717A]" />
          <span className="text-sm font-medium">{biz.name}</span>
        </li>
      ))}
    </ul>
  );
}
