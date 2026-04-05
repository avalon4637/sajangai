"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Search,
  Building2,
  Plus,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Vendor } from "@/lib/queries/vendor";
import { addVendor, editVendor, removeVendor } from "@/lib/actions/vendor-actions";

// Format amount in Korean currency units
function formatAmount(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.floor((amount % 100_000_000) / 10_000);
    return man > 0 ? `${eok}억 ${man}만원` : `${eok}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.floor(amount / 10_000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

interface VendorsPageClientProps {
  vendors: Vendor[];
  vendorTotals: Record<string, number>;
}

export function VendorsPageClient({
  vendors,
  vendorTotals,
}: VendorsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit sheet state
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Delete dialog state
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Client-side search filter
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q) ||
        v.contact_name?.toLowerCase().includes(q)
    );
  }, [vendors, searchQuery]);

  // Add vendor handler
  async function handleAddVendor(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const input = {
      name: formData.get("name") as string,
      category: (formData.get("category") as string) || undefined,
      contactName: (formData.get("contactName") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      businessNumber: (formData.get("businessNumber") as string) || undefined,
      memo: (formData.get("memo") as string) || undefined,
    };

    startTransition(async () => {
      const result = await addVendor(input);
      if (result.success) {
        setDialogOpen(false);
        form.reset();
      } else {
        alert(result.error ?? "등록 실패");
      }
    });
  }

  // Edit vendor handler
  async function handleEditVendor(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!editingVendor) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const input = {
      id: editingVendor.id,
      name: formData.get("name") as string,
      category: (formData.get("category") as string) || undefined,
      contactName: (formData.get("contactName") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      businessNumber: (formData.get("businessNumber") as string) || undefined,
      memo: (formData.get("memo") as string) || undefined,
    };

    startTransition(async () => {
      const result = await editVendor(input);
      if (result.success) {
        setEditSheetOpen(false);
        setEditingVendor(null);
      } else {
        alert(result.error ?? "수정 실패");
      }
    });
  }

  // Delete vendor handler
  function handleDeleteVendor(): void {
    if (!deletingVendor) return;

    startTransition(async () => {
      const result = await removeVendor(deletingVendor.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setDeletingVendor(null);
      } else {
        alert(result.error ?? "삭제 실패");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="거래처 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Vendor list */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {searchQuery
                ? "검색 결과가 없습니다."
                : "등록된 거래처가 없습니다."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVendors.map((vendor) => {
            const monthlyTotal = vendorTotals[vendor.name] ?? 0;

            return (
              <Card key={vendor.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {vendor.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {vendor.category && (
                          <Badge variant="secondary" className="text-xs">
                            {vendor.category}
                          </Badge>
                        )}
                        {vendor.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {vendor.phone}
                          </span>
                        )}
                      </div>
                      {vendor.contact_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          담당: {vendor.contact_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">이번 달 거래</p>
                        <p className="text-sm font-medium">
                          {monthlyTotal > 0 ? formatAmount(monthlyTotal) : "-"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                          >
                            <MoreVertical className="size-4" />
                            <span className="sr-only">메뉴 열기</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingVendor(vendor);
                              setEditSheetOpen(true);
                            }}
                          >
                            <Pencil className="size-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeletingVendor(vendor);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add vendor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <Plus className="size-4 mr-2" />
            거래처 추가
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거래처 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">거래처명</Label>
              <Input
                id="vendor-name"
                name="name"
                placeholder="거래처명 입력"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-category">카테고리</Label>
              <Input
                id="vendor-category"
                name="category"
                placeholder="식자재, 소모품, 임대 등"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vendor-contact">담당자명</Label>
                <Input
                  id="vendor-contact"
                  name="contactName"
                  placeholder="담당자"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-phone">연락처</Label>
                <Input
                  id="vendor-phone"
                  name="phone"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-biznum">사업자번호</Label>
              <Input
                id="vendor-biznum"
                name="businessNumber"
                placeholder="000-00-00000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-memo">메모</Label>
              <Input
                id="vendor-memo"
                name="memo"
                placeholder="메모 (선택)"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "등록 중..." : "등록"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit vendor sheet */}
      <Sheet open={editSheetOpen} onOpenChange={(open) => {
        setEditSheetOpen(open);
        if (!open) setEditingVendor(null);
      }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>거래처 수정</SheetTitle>
          </SheetHeader>
          {editingVendor && (
            <form onSubmit={handleEditVendor} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name">거래처명</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingVendor.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">카테고리</Label>
                <Input
                  id="edit-category"
                  name="category"
                  defaultValue={editingVendor.category ?? ""}
                  placeholder="식자재, 소모품, 임대 등"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">담당자명</Label>
                <Input
                  id="edit-contact"
                  name="contactName"
                  defaultValue={editingVendor.contact_name ?? ""}
                  placeholder="담당자"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">연락처</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={editingVendor.phone ?? ""}
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-biznum">사업자번호</Label>
                <Input
                  id="edit-biznum"
                  name="businessNumber"
                  defaultValue={editingVendor.business_number ?? ""}
                  placeholder="000-00-00000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-memo">메모</Label>
                <Input
                  id="edit-memo"
                  name="memo"
                  defaultValue={editingVendor.memo ?? ""}
                  placeholder="메모 (선택)"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "저장 중..." : "저장"}
              </Button>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setDeletingVendor(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래처 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingVendor?.name}</strong> 거래처를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVendor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
