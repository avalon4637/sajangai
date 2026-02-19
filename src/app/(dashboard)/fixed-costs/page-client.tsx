"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FixedCostForm } from "@/components/data-entry/fixed-cost-form";
import { FixedCostTable } from "@/components/data-entry/fixed-cost-table";
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

      <FixedCostTable
        data={fixedCosts}
        onEdit={(fixedCost) => setEditingFixedCost(fixedCost)}
      />
    </div>
  );
}
