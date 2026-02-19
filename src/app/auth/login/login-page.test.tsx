import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Supabase client
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
  });

  it("should render login form when no session exists", async () => {
    render(<LoginPage />);

    expect(
      await screen.findByText("이메일과 비밀번호를 입력해주세요")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("8자 이상 입력해주세요")
    ).toBeInTheDocument();
  });

  it("should render signup link", async () => {
    render(<LoginPage />);

    const signupLink = await screen.findByText("회원가입");
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest("a")).toHaveAttribute("href", "/auth/signup");
  });

  it("should redirect to dashboard when session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "test-user" }, access_token: "token" },
      },
    });

    render(<LoginPage />);

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should render email and password input fields", async () => {
    render(<LoginPage />);

    const emailInput = await screen.findByLabelText("이메일");
    const passwordInput = screen.getByLabelText("비밀번호");

    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should render submit button", async () => {
    render(<LoginPage />);

    const button = await screen.findByRole("button", { name: "로그인" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });
});
