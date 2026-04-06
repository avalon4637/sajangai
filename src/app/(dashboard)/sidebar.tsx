"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings, LogOut, CreditCard, MessageSquare,
  Calendar, Wallet, FileText, Building2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { BusinessSwitcher } from "@/components/business/business-switcher";

const STORAGE_KEY = "sidebar-menu-state";

/** Agent-persona-based navigation items */
export const agentNavItems = [
  {
    href: "/dashboard",
    emoji: "\u{1F468}\u200D\u{1F4BC}",
    name: "\uC810\uC7A5",
    role: "\uD648 \xB7 \uC885\uD569 \uBE0C\uB9AC\uD551",
    exact: true,
  },
  {
    href: "/analysis",
    emoji: "\u{1F4CA}",
    name: "\uC138\uB9AC",
    role: "\uB9E4\uCD9C \uBD84\uC11D",
    exact: false,
  },
  {
    href: "/review",
    emoji: "\u2B50",
    name: "\uB2F5\uC7A5\uC774",
    role: "\uB9AC\uBDF0 \uBD84\uC11D",
    exact: false,
  },
  {
    href: "/marketing",
    emoji: "\u{1F4E2}",
    name: "\uBC14\uC774\uB7F4",
    role: "\uB9C8\uCF00\uD305",
    exact: false,
  },
];

/** Data management quick links */
const dataNavItems = [
  { href: "/ledger", icon: Calendar, label: "\uB9E4\uCD9C/\uB9E4\uC785" },
  { href: "/fixed-costs", icon: Wallet, label: "\uACE0\uC815\uBE44" },
  { href: "/invoices", icon: FileText, label: "\uACC4\uC0B0\uC11C" },
  { href: "/vendors", icon: Building2, label: "\uAC70\uB798\uCC98" },
];

function loadMenuState(): Record<string, boolean> {
  if (typeof window === "undefined") return { data: true };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return { data: true };
}

function saveMenuState(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

interface SidebarProps {
  userEmail: string;
  businessName?: string;
  subscriptionStatus?: string;
  businesses: { id: string; name: string }[];
  currentBusinessId: string;
}

export function Sidebar({ userEmail, businessName, subscriptionStatus, businesses, currentBusinessId }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [menuState, setMenuState] = useState<Record<string, boolean>>({ data: true });

  useEffect(() => {
    setMenuState(loadMenuState());
  }, []);

  const toggleSection = (key: string) => {
    setMenuState((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveMenuState(next);
      return next;
    });
  };

  const isDataOpen = menuState.data !== false;

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-bold text-[#18181B] tracking-tight">
          사장 AI
        </h1>
        <p className="text-xs text-[#71717A] mt-0.5">AI 점장 서비스</p>
      </div>

      {/* Business switcher */}
      <div className="border-b">
        <BusinessSwitcher businesses={businesses} currentBusinessId={currentBusinessId} />
      </div>

      {/* Scrollable navigation area */}
      <div className="flex-1 overflow-y-auto">
        {/* AI 팀 section - always visible, not collapsible */}
        <nav className="px-3 py-4">
          <p className="px-3 mb-2 text-xs font-medium text-[#71717A]">AI 팀</p>
          <ul className="space-y-1">
            {agentNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "text-[#18181B] hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl leading-none">{item.emoji}</span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm leading-tight ${
                          isActive ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-xs leading-tight mt-0.5 ${
                          isActive ? "text-[#2563EB]/70" : "text-[#71717A]"
                        }`}
                      >
                        {item.role}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 데이터 관리 section - collapsible */}
        <div className="border-t px-3 py-3">
          <Collapsible open={isDataOpen} onOpenChange={() => toggleSection("data")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-3 mb-2 group cursor-pointer">
              <p className="text-xs font-medium text-[#71717A]">데이터 관리</p>
              <ChevronDown
                className={`size-3.5 text-[#71717A] transition-transform duration-200 ${
                  isDataOpen ? "" : "-rotate-90"
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-0.5">
                {dataNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                            : "text-[#71717A] hover:bg-gray-50 font-medium"
                        }`}
                      >
                        <item.icon className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* AI 채팅 */}
        <div className="border-t px-3 py-3">
          <Link
            href="/chat"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname.startsWith("/chat")
                ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                : "text-[#18181B] hover:bg-gray-50 font-medium"
            }`}
          >
            <MessageSquare className="size-4 shrink-0" />
            AI 채팅
          </Link>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t px-3 py-4 space-y-1">
        {/* Billing */}
        <Link
          href="/billing"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            pathname.startsWith("/billing")
              ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
              : "text-[#71717A] hover:bg-gray-50 font-medium"
          }`}
        >
          <CreditCard className="size-4 shrink-0" />
          요금제
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
              : "text-[#71717A] hover:bg-gray-50 font-medium"
          }`}
        >
          <Settings className="size-4 shrink-0" />
          설정
        </Link>

        {/* User profile */}
        <div className="px-3 py-2.5 rounded-lg bg-gray-50">
          <p className="text-sm font-semibold text-[#18181B] truncate">
            {businessName ?? "사장님"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              subscriptionStatus === "active"
                ? "bg-[#EFF6FF] text-[#2563EB]"
                : subscriptionStatus === "trial"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-500"
            }`}>
              {subscriptionStatus === "active" ? "점장 고용 중" :
               subscriptionStatus === "trial" ? "무료 체험 중" : "미구독"}
            </span>
          </div>
          <p className="text-xs text-[#71717A] truncate mt-1">{userEmail}</p>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-[#71717A] hover:text-[#18181B] font-medium"
          onClick={signOut}
        >
          <LogOut className="size-4" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
