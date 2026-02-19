"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, Receipt, Building, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userEmail: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "홈", icon: Home },
    { href: "/dashboard/revenue", label: "매출 관리", icon: TrendingUp },
    { href: "/dashboard/expense", label: "비용 관리", icon: Receipt },
    { href: "/dashboard/fixed-costs", label: "고정비 관리", icon: Building },
  ];

  return (
    <aside className="flex w-64 flex-col border-r bg-card min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">사장.ai</h1>
      </div>

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

      <div className="border-t p-4">
        <p className="mb-3 truncate text-sm text-muted-foreground">
          {userEmail}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={signOut}
        >
          <LogOut className="size-4" />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
