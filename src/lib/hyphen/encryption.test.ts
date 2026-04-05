import { describe, it, expect, vi, beforeEach } from "vitest";
import { encryptCredentials, decryptCredentials } from "./encryption";

// Set a test encryption key (32 bytes = 64 hex chars)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("encryption", () => {
  beforeEach(() => {
    vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", TEST_KEY);
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("encryptCredentials", () => {
    it("should produce a non-empty string", () => {
      const result = encryptCredentials({ apiKey: "test-key" });
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should produce valid JSON containing iv, authTag, ciphertext", () => {
      const result = encryptCredentials({ username: "user1" });
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("iv");
      expect(parsed).toHaveProperty("authTag");
      expect(parsed).toHaveProperty("ciphertext");
    });

    it("should produce different ciphertexts for different inputs", () => {
      const r1 = encryptCredentials({ key: "value1" });
      const r2 = encryptCredentials({ key: "value2" });
      expect(r1).not.toBe(r2);
    });

    it("should produce different ciphertexts for same input (random IV)", () => {
      const r1 = encryptCredentials({ key: "same-value" });
      const r2 = encryptCredentials({ key: "same-value" });
      // Due to random IV, the ciphertexts should differ
      const p1 = JSON.parse(r1);
      const p2 = JSON.parse(r2);
      expect(p1.iv).not.toBe(p2.iv);
    });
  });

  describe("decryptCredentials", () => {
    it("should recover original data (round-trip)", () => {
      const original = { apiKey: "sk-12345", secret: "my-secret" };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("should handle empty credentials object", () => {
      const original = {};
      const encrypted = encryptCredentials(original as Record<string, string>);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("should handle special characters in values", () => {
      const original = {
        key: "value with spaces & special chars: !@#$%^&*()",
        unicode: "Korean text here",
      };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("should handle long values", () => {
      const original = { longKey: "x".repeat(10_000) };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("should throw on tampered ciphertext", () => {
      const encrypted = encryptCredentials({ key: "value" });
      const parsed = JSON.parse(encrypted);
      // Tamper with ciphertext
      parsed.ciphertext = "00".repeat(parsed.ciphertext.length / 2);
      expect(() => decryptCredentials(JSON.stringify(parsed))).toThrow();
    });

    it("should throw on tampered authTag", () => {
      const encrypted = encryptCredentials({ key: "value" });
      const parsed = JSON.parse(encrypted);
      parsed.authTag = "00".repeat(parsed.authTag.length / 2);
      expect(() => decryptCredentials(JSON.stringify(parsed))).toThrow();
    });
  });

  describe("encryption key validation", () => {
    it("should throw on invalid key length", () => {
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "tooshort");
      expect(() => encryptCredentials({ key: "val" })).toThrow(
        /CREDENTIAL_ENCRYPTION_KEY must be/
      );
    });

    it("should use dev fallback when no key in non-production", () => {
      vi.stubEnv("CREDENTIAL_ENCRYPTION_KEY", "");
      vi.stubEnv("NODE_ENV", "development");
      // Should not throw; uses fallback key
      const original = { test: "fallback" };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });
  });
});
