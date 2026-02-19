import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SignupPage from "./page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      signUp: mockSignUp,
    },
  }),
}));

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it("should render signup form when no session exists", async () => {
    render(<SignupPage />);

    expect(
      await screen.findByText("계정을 생성하여 시작하세요")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com")
    ).toBeInTheDocument();
  });

  it("should render login link", async () => {
    render(<SignupPage />);

    const loginLink = await screen.findByText("로그인");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/auth/login");
  });

  it("should redirect to dashboard when session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "test-user" }, access_token: "token" },
      },
    });

    render(<SignupPage />);

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should render email, password, and confirm password fields", async () => {
    render(<SignupPage />);

    const emailInput = await screen.findByLabelText("이메일");
    const passwordInput = screen.getByLabelText("비밀번호");
    const confirmInput = screen.getByLabelText("비밀번호 확인");

    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");
  });

  it("should render submit button", async () => {
    render(<SignupPage />);

    const button = await screen.findByRole("button", { name: "회원가입" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });
});
