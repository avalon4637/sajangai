import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingForm } from "./onboarding-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
const mockRegisterBusiness = vi.fn();
const mockVerifyBusinessNumber = vi.fn();
vi.mock("@/lib/actions/business", () => ({
  registerBusiness: (...args: unknown[]) => mockRegisterBusiness(...args),
  verifyBusinessNumber: (...args: unknown[]) => mockVerifyBusinessNumber(...args),
}));

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterBusiness.mockResolvedValue({ success: true });
  });

  it("should render all form fields", () => {
    render(<OnboardingForm />);

    expect(
      screen.getByText("사업장 정보를 입력하면 AI 점장이 맞춤 분석을 시작해요.")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/사업장명/)).toBeInTheDocument();
    expect(screen.getByLabelText("업종")).toBeInTheDocument();
    expect(screen.getByLabelText("주소")).toBeInTheDocument();
  });

  it("should render submit button", () => {
    render(<OnboardingForm />);

    const button = screen.getByRole("button", { name: "사업장 등록" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("should show validation error when name is empty", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    const button = screen.getByRole("button", { name: "사업장 등록" });
    await user.click(button);

    expect(
      await screen.findByText("사업장명을 입력해주세요")
    ).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    await user.type(screen.getByLabelText(/사업장명/), "Test Business");
    await user.type(screen.getByLabelText("업종"), "Restaurant");
    await user.type(screen.getByLabelText("주소"), "Seoul");

    await user.click(screen.getByRole("button", { name: "사업장 등록" }));

    await vi.waitFor(() => {
      expect(mockRegisterBusiness).toHaveBeenCalledWith({
        name: "Test Business",
        business_type: "Restaurant",
        address: "Seoul",
      });
    });
  });

  it("should redirect to dashboard on successful submit", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm />);

    await user.type(screen.getByLabelText(/사업장명/), "Test Business");
    await user.click(screen.getByRole("button", { name: "사업장 등록" }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/onboarding/preferences");
    });
  });

  it("should show error message on registration failure", async () => {
    mockRegisterBusiness.mockResolvedValue({
      success: false,
      error: "사업장 등록에 실패했습니다.",
    });

    const user = userEvent.setup();
    render(<OnboardingForm />);

    await user.type(screen.getByLabelText(/사업장명/), "Test Business");
    await user.click(screen.getByRole("button", { name: "사업장 등록" }));

    expect(
      await screen.findByText("사업장 등록에 실패했습니다.")
    ).toBeInTheDocument();
  });
});
