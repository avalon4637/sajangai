"use client";

import { useState } from "react";
import { Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FixedCostForm } from "@/components/data-entry/fixed-cost-form";
import { FixedCostTable } from "@/components/data-entry/fixed-cost-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { FixedCost } from "@/types/data-entry";

interface FixedCostPageClientProps {
  fixedCosts: FixedCost[];
}

export function FixedCostPageClient({ fixedCosts }: FixedCostPageClientProps) {
  const [editingFixedCost, setEditingFixedCost] = useState<
    FixedCost | undefined
  >(undefined);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingFixedCost ? "고정비 수정" : "고정비 등록"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FixedCostForm
            key={editingFixedCost?.id ?? "new"}
            editingFixedCost={editingFixedCost}
            onCancel={() => setEditingFixedCost(undefined)}
            onSuccess={() => setEditingFixedCost(undefined)}
          />
        </CardContent>
      </Card>

      {fixedCosts.length === 0 ? (
        <EmptyState
          icon={Building}
          title="아직 등록된 고정비가 없습니다"
          description="임대료, 인건비 등 매월 발생하는 고정비를 등록해주세요."
        />
      ) : (
        <FixedCostTable
          data={fixedCosts}
          onEdit={(fixedCost) => setEditingFixedCost(fixedCost)}
        />
      )}
    </div>
  );
}
