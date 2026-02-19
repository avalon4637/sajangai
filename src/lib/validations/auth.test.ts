import { describe, it, expect } from "vitest";
import { LoginSchema, SignupSchema, OnboardingSchema } from "./auth";

describe("LoginSchema", () => {
  it("should pass with valid email and password", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "올바른 이메일 주소를 입력해주세요"
      );
    }
  });

  it("should fail with empty email", () => {
    const result = LoginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short password", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "1234567",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "비밀번호는 최소 8자 이상이어야 합니다"
      );
    }
  });

  it("should pass with exactly 8 character password", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });
});

describe("SignupSchema", () => {
  it("should pass with matching passwords", () => {
    const result = SignupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when passwords do not match", () => {
    const result = SignupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => i.path.includes("confirmPassword")
      );
      expect(confirmError?.message).toBe("비밀번호가 일치하지 않습니다");
    }
  });

  it("should fail with invalid email", () => {
    const result = SignupSchema.safeParse({
      email: "bad-email",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with short password", () => {
    const result = SignupSchema.safeParse({
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("OnboardingSchema", () => {
  it("should pass with required name only", () => {
    const result = OnboardingSchema.safeParse({
      name: "My Business",
    });
    expect(result.success).toBe(true);
  });

  it("should pass with all fields", () => {
    const result = OnboardingSchema.safeParse({
      name: "My Business",
      business_type: "Restaurant",
      address: "Seoul, Korea",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty name", () => {
    const result = OnboardingSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("사업장명을 입력해주세요");
    }
  });

  it("should fail with name over 100 characters", () => {
    const result = OnboardingSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "사업장명은 100자 이하여야 합니다"
      );
    }
  });

  it("should pass with exactly 100 character name", () => {
    const result = OnboardingSchema.safeParse({
      name: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("should pass with optional fields undefined", () => {
    const result = OnboardingSchema.safeParse({
      name: "My Business",
      business_type: undefined,
      address: undefined,
    });
    expect(result.success).toBe(true);
  });
});
