"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Link2, Wallet, Landmark, Bot } from "lucide-react";

const tabs = [
  { href: "/settings", label: "데이터 연동", icon: Link2, exact: true },
  { href: "/settings/budget", label: "예산 관리", icon: Wallet },
  { href: "/settings/loans", label: "대출금", icon: Landmark },
  { href: "/settings/connections", label: "AI 에이전트", icon: Bot },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex border-b">
      {tabs.map((tab) => {
        const isExact = "exact" in tab && tab.exact;
        const isActive = isExact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors ${
              isActive
                ? "border-[#4B6BF5] text-[#4B6BF5] font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
