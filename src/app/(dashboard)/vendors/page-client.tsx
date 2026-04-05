"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, Building2, Plus, Phone } from "lucide-react";
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
import type { Vendor } from "@/lib/queries/vendor";
import { addVendor } from "@/lib/actions/vendor-actions";

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

  // Client-side search filter with debounce effect via useMemo
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
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">이번 달 거래</p>
                      <p className="text-sm font-medium">
                        {monthlyTotal > 0 ? formatAmount(monthlyTotal) : "-"}
                      </p>
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
    </div>
  );
}
