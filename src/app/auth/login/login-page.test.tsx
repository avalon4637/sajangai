import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "./login-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form", () => {
    render(<LoginForm />);

    expect(
      screen.getByText("이메일과 비밀번호를 입력해주세요")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("8자 이상 입력해주세요")
    ).toBeInTheDocument();
  });

  it("should render signup link", () => {
    render(<LoginForm />);

    const signupLink = screen.getByText("회원가입");
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest("a")).toHaveAttribute("href", "/auth/signup");
  });

  it("should render email and password input fields", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("이메일");
    const passwordInput = screen.getByLabelText("비밀번호");

    expect(emailInput).toHaveAttribute("type", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should render submit button", () => {
    render(<LoginForm />);

    const button = screen.getByRole("button", { name: "로그인" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should have noValidate attribute on form", () => {
    render(<LoginForm />);

    const form = document.querySelector("form");
    expect(form).toHaveAttribute("novalidate");
  });
});
