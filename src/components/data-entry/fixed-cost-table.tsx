"use client";

import { useState, useTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { deleteFixedCost } from "@/lib/actions/fixed-cost";
import type { FixedCost } from "@/types/data-entry";

interface FixedCostTableProps {
  data: FixedCost[];
  onEdit: (fixedCost: FixedCost) => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export function FixedCostTable({ data, onEdit }: FixedCostTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<FixedCost | null>(null);
  const [, startTransition] = useTransition();

  const totalFixedCost = data
    .filter((f) => !f.is_labor)
    .reduce((sum, f) => sum + f.amount, 0);
  const totalLaborCost = data
    .filter((f) => f.is_labor)
    .reduce((sum, f) => sum + f.amount, 0);

  const columns: ColumnDef<FixedCost>[] = [
    {
      accessorKey: "is_labor",
      header: "유형",
      cell: ({ row }) =>
        row.original.is_labor ? (
          <Badge variant="default">인건비</Badge>
        ) : (
          <Badge variant="outline">일반 고정비</Badge>
        ),
    },
    {
      accessorKey: "category",
      header: "카테고리",
      cell: ({ row }) => row.original.category,
    },
    {
      accessorKey: "amount",
      header: "월 금액",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatAmount(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "start_date",
      header: "시작일",
      cell: ({ row }) => row.original.start_date ?? "-",
    },
    {
      accessorKey: "end_date",
      header: "종료일",
      cell: ({ row }) => row.original.end_date ?? "-",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteFixedCost(deleteTarget.id);
      if (!result.success) {
        alert(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              일반 고정비 합계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(totalFixedCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              인건비 합계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatAmount(totalLaborCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  아직 등록된 고정비 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="고정비 삭제"
        description="이 고정비 항목을 삭제하시겠습니까? 삭제 후 월간 KPI가 자동으로 재계산됩니다."
      />
    </>
  );
}
