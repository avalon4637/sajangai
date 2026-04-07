"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
    // On success, browser redirects to Kakao — no further action needed
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo and tagline */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          사장AI
        </h1>
        <p className="text-muted-foreground text-sm">
          AI 점장에게 매장 관리를 맡겨보세요
        </p>
      </div>

      {/* Kakao login button */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleKakaoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 px-6 font-semibold text-[15px] transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: "#FEE500", color: "#000000" }}
          aria-label="카카오로 시작하기"
        >
          {/* Kakao logo SVG */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 3C7.03 3 3 6.14 3 10.05c0 2.52 1.66 4.73 4.14 6.01l-.84 3.13c-.07.28.24.5.49.35L10.7 17.1c.43.06.86.1 1.3.1 4.97 0 9-3.14 9-7.05C21 6.14 16.97 3 12 3z"
              fill="currentColor"
            />
          </svg>
          {isLoading ? "연결 중..." : "카카오로 시작하기"}
        </button>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          로그인하면{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            서비스 이용약관
          </Link>
          {" "}및{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
