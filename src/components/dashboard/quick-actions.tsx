"use client";

import Link from "next/link";
import { TrendingUp, Receipt, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  {
    href: "/revenue",
    icon: TrendingUp,
    label: "매출 입력",
    description: "매출 데이터를 등록합니다",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    href: "/expense",
    icon: Receipt,
    label: "비용 입력",
    description: "변동비/고정비를 등록합니다",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    href: "/fixed-costs",
    icon: Building,
    label: "고정비 관리",
    description: "월 고정 비용을 관리합니다",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">빠른 메뉴</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className={`p-2 rounded-lg ${action.bgColor}`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div>
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
