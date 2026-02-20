"use client";

import { Users, TrendingUp, Building, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SimulationType } from "@/lib/simulation/engine";
import { cn } from "@/lib/utils";

interface ScenarioCardsProps {
  selectedType: SimulationType | null;
  onSelect: (type: SimulationType) => void;
}

const scenarios: {
  type: SimulationType;
  icon: typeof Users;
  title: string;
  description: string;
}[] = [
  {
    type: "employee_change",
    icon: Users,
    title: "직원 변동",
    description: "직원을 고용/감원하면?",
  },
  {
    type: "revenue_change",
    icon: TrendingUp,
    title: "매출 변동",
    description: "매출이 변하면?",
  },
  {
    type: "rent_change",
    icon: Building,
    title: "임대료 변동",
    description: "임대료가 변하면?",
  },
  {
    type: "expense_change",
    icon: ShoppingCart,
    title: "매입 변동",
    description: "재료비가 변하면?",
  },
];

export function ScenarioCards({ selectedType, onSelect }: ScenarioCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {scenarios.map((scenario) => {
        const isSelected = selectedType === scenario.type;
        const Icon = scenario.icon;

        return (
          <Card
            key={scenario.type}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(scenario.type)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-medium">{scenario.title}</p>
                <p className="text-sm text-muted-foreground">
                  {scenario.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
