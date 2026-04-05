"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, LogOut, CreditCard, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { agentNavItems } from "./sidebar";

interface MobileHeaderProps {
  userEmail: string;
  businessName?: string;
  subscriptionStatus?: string;
}

/**
 * Mobile header with hamburger menu that opens a Sheet drawer.
 * Only visible on viewports < 768px.
 */
export function MobileHeader({ userEmail, businessName, subscriptionStatus }: MobileHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex md:hidden items-center justify-between border-b bg-white px-4 py-3">
      <div>
        <h1 className="text-base font-bold text-[#18181B] tracking-tight">
          사장 AI
        </h1>
        <p className="text-xs text-[#71717A]">AI 점장 서비스</p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="메뉴 열기">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle className="text-lg font-bold text-[#18181B] tracking-tight text-left">
              사장 AI
            </SheetTitle>
            <p className="text-xs text-[#71717A] mt-0.5 text-left">
              AI 점장 서비스
            </p>
          </SheetHeader>

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
                      onClick={() => setOpen(false)}
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

          {/* AI Chat */}
          <div className="border-t px-3 py-3">
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
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

          <div className="border-t px-3 py-4 space-y-1">
            {/* Billing */}
            <Link
              href="/billing"
              onClick={() => setOpen(false)}
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
              onClick={() => setOpen(false)}
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
                {businessName ?? "사장"}님
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  subscriptionStatus === "active"
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : subscriptionStatus === "trial"
                      ? "bg-[#FFF7ED] text-[#EA580C]"
                      : "bg-gray-100 text-gray-500"
                }`}>
                  {subscriptionStatus === "active"
                    ? "점장 고용 중"
                    : subscriptionStatus === "trial"
                      ? "무료 체험 중"
                      : "미구독"}
                </span>
              </div>
              <p className="text-xs text-[#71717A] truncate mt-1">{userEmail}</p>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-[#71717A] hover:text-[#18181B] font-medium"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
            >
              <LogOut className="size-4" />
              로그아웃
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
