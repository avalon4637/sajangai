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
import { BusinessSwitcher } from "@/components/business/business-switcher";

interface MobileHeaderProps {
  userEmail: string;
  businessName?: string;
  subscriptionStatus?: string;
  businesses: { id: string; name: string }[];
  currentBusinessId: string;
}

/**
 * Mobile header with hamburger menu that opens a Sheet drawer.
 * Only visible on viewports < 768px.
 */
export function MobileHeader({ userEmail, businessName, subscriptionStatus, businesses, currentBusinessId }: MobileHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="shrink-0 flex md:hidden items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
      <div>
        <h1 className="text-base font-bold text-foreground tracking-tight">
          사장AI
        </h1>
        <p className="text-xs text-muted-foreground">AI 점장 서비스</p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="메뉴 열기">
            <Menu className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 max-w-[85vw] p-0 bg-white">
          <SheetHeader className="px-6 py-5 border-b">
            <SheetTitle className="text-lg font-bold text-foreground tracking-tight text-left">
              사장AI
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5 text-left">
              AI 점장 서비스
            </p>
          </SheetHeader>

          {/* Business switcher */}
          <div className="border-b">
            <BusinessSwitcher businesses={businesses} currentBusinessId={currentBusinessId} />
          </div>

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
                          ? "bg-primary/10 border-l-2 border-primary text-primary font-medium"
                          : "hover:bg-muted/50 text-muted-foreground"
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
                            isActive ? "text-primary/70" : "text-muted-foreground"
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
                  ? "bg-primary/10 border-l-2 border-primary text-primary font-medium"
                  : "hover:bg-muted/50 text-muted-foreground"
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
                  ? "bg-primary/10 border-l-2 border-primary text-primary font-medium"
                  : "hover:bg-muted/50 text-muted-foreground"
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
                  ? "bg-primary/10 border-l-2 border-primary text-primary font-medium"
                  : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Settings className="size-4 shrink-0" />
              설정
            </Link>

            {/* User profile */}
            <div className="px-3 py-2.5 rounded-lg bg-gray-50">
              <p className="text-sm font-semibold text-foreground truncate">
                {businessName ?? "사장"}님
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  subscriptionStatus === "active"
                    ? "bg-primary/10 text-primary"
                    : subscriptionStatus === "trial"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                }`}>
                  {subscriptionStatus === "active"
                    ? "점장 고용 중"
                    : subscriptionStatus === "trial"
                      ? "무료 체험 중"
                      : "미구독"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{userEmail}</p>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground font-medium"
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
