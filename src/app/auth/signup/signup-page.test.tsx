import { describe, it, expect, vi } from "vitest";

// SignupPage now simply redirects to /auth/login via next/navigation redirect().
// We verify that behavior rather than testing the old form-based signup.

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("SignupPage", () => {
  it("calls redirect to /auth/login", async () => {
    const { redirect } = await import("next/navigation");
    const { default: SignupPage } = await import("./page");

    SignupPage();

    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });
});
