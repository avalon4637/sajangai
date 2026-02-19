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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { deleteExpense } from "@/lib/actions/expense";
import type { Expense } from "@/types/data-entry";

interface ExpenseTableProps {
  data: Expense[];
  onEdit: (expense: Expense) => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export function ExpenseTable({ data, onEdit }: ExpenseTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [, startTransition] = useTransition();

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "날짜",
      cell: ({ row }) => row.original.date,
    },
    {
      accessorKey: "type",
      header: "유형",
      cell: ({ row }) =>
        row.original.type === "fixed" ? (
          <Badge variant="destructive">고정비</Badge>
        ) : (
          <Badge variant="secondary">변동비</Badge>
        ),
    },
    {
      accessorKey: "category",
      header: "카테고리",
      cell: ({ row }) => row.original.category,
    },
    {
      accessorKey: "amount",
      header: "금액",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatAmount(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "memo",
      header: "메모",
      cell: ({ row }) => row.original.memo ?? "-",
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
      const result = await deleteExpense(deleteTarget.id);
      if (!result.success) {
        alert(result.error);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
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
                  아직 등록된 비용 데이터가 없습니다.
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
        title="비용 삭제"
        description="이 비용 기록을 삭제하시겠습니까? 삭제 후 월간 KPI가 자동으로 재계산됩니다."
      />
    </>
  );
}
