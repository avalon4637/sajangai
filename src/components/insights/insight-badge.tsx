interface InsightBadgeProps {
  count: number;
}

export function InsightBadge({ count }: InsightBadgeProps) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1">
      {count > 99 ? "99+" : count}
    </span>
  );
}
