"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings, LogOut, CreditCard, MessageSquare,
  PlusCircle, Receipt, Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

/** Agent-persona-based navigation items */
export const agentNavItems = [
  {
    href: "/dashboard",
    emoji: "👨‍💼",
    name: "점장",
    role: "홈 · 종합 브리핑",
    exact: true,
  },
  {
    href: "/analysis",
    emoji: "📊",
    name: "세리",
    role: "매출 분석",
    exact: false,
  },
  {
    href: "/review",
    emoji: "⭐",
    name: "답장이",
    role: "리뷰 분석",
    exact: false,
  },
  {
    href: "/marketing",
    emoji: "📢",
    name: "바이럴",
    role: "마케팅",
    exact: false,
  },
];

/** Data entry quick links */
const dataNavItems = [
  { href: "/revenue", icon: PlusCircle, label: "매출 입력" },
  { href: "/expense", icon: Receipt, label: "지출 입력" },
  { href: "/fixed-costs", icon: Wallet, label: "고정비" },
];

interface SidebarProps {
  userEmail: string;
  businessName?: string;
  subscriptionStatus?: string;
}

export function Sidebar({ userEmail, businessName, subscriptionStatus }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-bold text-[#18181B] tracking-tight">
          사장 AI
        </h1>
        <p className="text-xs text-[#71717A] mt-0.5">AI 점장 서비스</p>
      </div>

      {/* Agent navigation */}
      <nav className="flex-1 px-3 py-4">
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

      {/* Data entry links */}
      <div className="border-t px-3 py-3">
        <p className="px-3 mb-2 text-xs font-medium text-[#71717A]">데이터 입력</p>
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
      </div>

      {/* AI Chat */}
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
