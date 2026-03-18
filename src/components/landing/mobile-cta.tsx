"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function MobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (~500px)
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 p-3 backdrop-blur-sm md:hidden">
      <a href="/auth/login" className="block">
        <Button
          className="w-full rounded-full text-sm font-semibold"
          style={{
            backgroundColor: "var(--landing-primary)",
            color: "var(--landing-primary-foreground)",
          }}
        >
          무료 체험 시작하기
        </Button>
      </a>
    </div>
  );
}
