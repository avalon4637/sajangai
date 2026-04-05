"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <h1 className="text-[120px] font-extrabold leading-none bg-gradient-to-b from-[#4B6BF5] to-[#93B5FF] bg-clip-text text-transparent">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-semibold text-[#1A1A1A]">
        페이지를 찾을 수 없습니다
      </h2>
      <p className="mt-2 text-base text-[#888888]">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg" className="gap-2 bg-[#4B6BF5] hover:bg-[#3B5BD5]">
          <Link href="/dashboard">
            <Home className="size-4" />
            대시보드로 이동
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          이전 페이지
        </Button>
      </div>
    </div>
  );
}
