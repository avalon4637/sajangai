import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

// Mock Supabase client
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render logo and tagline", () => {
    render(<LoginForm />);

    expect(screen.getByText("사장AI")).toBeInTheDocument();
    expect(screen.getByText("하루 330원, 점장 한 명")).toBeInTheDocument();
  });

  it("should render Kakao login button", () => {
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: "카카오로 시작하기" });
    expect(button).toBeInTheDocument();
  });

  it("should call signInWithOAuth on Kakao button click", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: "카카오로 시작하기" });
    await user.click(button);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "kakao",
      options: {
        redirectTo: expect.stringContaining("/auth/callback"),
      },
    });
  });

  it("should show error message on login failure", async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      error: new Error("OAuth error"),
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: "카카오로 시작하기" });
    await user.click(button);

    expect(
      screen.getByText("카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
    ).toBeInTheDocument();
  });

  it("should render terms notice", () => {
    render(<LoginForm />);

    expect(
      screen.getByText(/서비스 이용약관 및 개인정보처리방침/)
    ).toBeInTheDocument();
  });
});
