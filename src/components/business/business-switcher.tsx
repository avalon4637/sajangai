"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchBusiness } from "@/lib/actions/business-switch";

interface Business {
  id: string;
  name: string;
}

interface BusinessSwitcherProps {
  businesses: Business[];
  currentBusinessId: string;
}

export function BusinessSwitcher({
  businesses,
  currentBusinessId,
}: BusinessSwitcherProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const currentBusiness = businesses.find((b) => b.id === currentBusinessId);

  const handleSwitch = async (businessId: string) => {
    if (businessId === currentBusinessId) return;
    setIsLoading(true);
    await switchBusiness(businessId);
    router.refresh();
    setIsLoading(false);
  };

  // Only show switcher when user has multiple businesses
  if (businesses.length <= 1) {
    return (
      <div className="flex w-full items-center gap-2 px-3 py-2.5">
        <Building2 className="size-4 shrink-0 text-[#71717A]" />
        <span className="flex-1 truncate text-sm font-medium text-[#18181B]">
          {currentBusiness?.name ?? "사업장"}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          <Building2 className="size-4 shrink-0 text-[#71717A]" />
          <span className="flex-1 truncate text-sm font-medium text-[#18181B]">
            {currentBusiness?.name ?? "사업장"}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-[#71717A]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {businesses.map((biz) => (
          <DropdownMenuItem
            key={biz.id}
            onClick={() => handleSwitch(biz.id)}
            className="flex items-center gap-2"
          >
            {biz.id === currentBusinessId ? (
              <Check className="size-4 text-blue-600" />
            ) : (
              <div className="size-4" />
            )}
            <span className="truncate">{biz.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/settings/business")}
          className="flex items-center gap-2 text-blue-600"
        >
          <Plus className="size-4" />
          <span>사업장 추가</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
