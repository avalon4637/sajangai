import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingForm } from "./onboarding-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Supabase client
const mockInsert = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("should render all form fields", () => {
    render(<OnboardingForm userId="test-user-id" />);

    expect(
      screen.getByText("서비스를 이용하려면 사업장 정보를 등록해주세요.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/사업장명/)).toBeInTheDocument();
    expect(screen.getByLabelText("업종")).toBeInTheDocument();
    expect(screen.getByLabelText("주소")).toBeInTheDocument();
  });

  it("should render submit button", () => {
    render(<OnboardingForm userId="test-user-id" />);

    const button = screen.getByRole("button", { name: "사업장 등록" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should show validation error when name is empty", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm userId="test-user-id" />);

    const button = screen.getByRole("button", { name: "사업장 등록" });
    await user.click(button);

    expect(
      await screen.findByText("사업장명을 입력해주세요")
    ).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm userId="test-user-id" />);

    await user.type(screen.getByLabelText(/사업장명/), "Test Business");
    await user.type(screen.getByLabelText("업종"), "Restaurant");
    await user.type(screen.getByLabelText("주소"), "Seoul");

    await user.click(screen.getByRole("button", { name: "사업장 등록" }));

    await vi.waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        name: "Test Business",
        business_type: "Restaurant",
        address: "Seoul",
      });
    });
  });

  it("should redirect to dashboard on successful submit", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm userId="test-user-id" />);

    await user.type(screen.getByLabelText(/사업장명/), "Test Business");
    await user.click(screen.getByRole("button", { name: "사업장 등록" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should show error message on insert failure", async () => {
    mockInsert.mockResolvedValue({
      error: { message: "Database error" },
    });

    const user = userEvent.setup();
    render(<OnboardingForm userId="test-user-id" />);

    await user.type(screen.getByLabelText(/사업장명/), "Test Business");
    await user.click(screen.getByRole("button", { name: "사업장 등록" }));

    expect(
      await screen.findByText("사업장 등록에 실패했습니다. 다시 시도해주세요.")
    ).toBeInTheDocument();
  });
});
