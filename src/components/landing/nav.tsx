"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollTo(id: string) {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => scrollTo("hero")}
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--landing-primary)" }}
        >
          사장 AI
        </button>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          <button
            onClick={() => scrollTo("problem")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            문제
          </button>
          <button
            onClick={() => scrollTo("solution")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            해결책
          </button>
          <button
            onClick={() => scrollTo("ai-team")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            AI 팀
          </button>
          <button
            onClick={() => scrollTo("features")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            기능
          </button>
          <button
            onClick={() => scrollTo("faq")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </button>
          <Button
            size="sm"
            className="rounded-full px-5"
            style={{
              backgroundColor: "var(--landing-primary)",
              color: "var(--landing-primary-foreground)",
            }}
            onClick={() => scrollTo("cta-final")}
          >
            무료 체험 시작하기
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {mobileOpen ? (
            <X className="size-6" />
          ) : (
            <Menu className="size-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            <button
              onClick={() => scrollTo("problem")}
              className="py-2 text-left text-sm text-muted-foreground"
            >
              문제
            </button>
            <button
              onClick={() => scrollTo("solution")}
              className="py-2 text-left text-sm text-muted-foreground"
            >
              해결책
            </button>
            <button
              onClick={() => scrollTo("ai-team")}
              className="py-2 text-left text-sm text-muted-foreground"
            >
              AI 팀
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="py-2 text-left text-sm text-muted-foreground"
            >
              기능
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="py-2 text-left text-sm text-muted-foreground"
            >
              FAQ
            </button>
            <Button
              className="mt-1 rounded-full"
              style={{
                backgroundColor: "var(--landing-primary)",
                color: "var(--landing-primary-foreground)",
              }}
              onClick={() => scrollTo("cta-final")}
            >
              무료 체험 시작하기
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
