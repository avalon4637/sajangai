"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "./sidebar";

interface MobileHeaderProps {
  userEmail: string;
}

/**
 * Mobile header with hamburger menu that opens a Sheet drawer.
 * Only visible on viewports < 768px.
 */
export function MobileHeader({ userEmail }: MobileHeaderProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex md:hidden items-center justify-between border-b bg-card px-4 py-3">
      <h1 className="text-lg font-bold">사장.ai</h1>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="메뉴 열기">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="text-xl font-bold">사장.ai</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 px-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t p-4 mt-auto space-y-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/settings")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Settings className="size-4" />
              설정
            </Link>
            <p className="truncate px-3 text-sm text-muted-foreground">
              {userEmail}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
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
