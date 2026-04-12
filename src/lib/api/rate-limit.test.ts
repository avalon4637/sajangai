import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRateLimitKey } from "./rate-limit";

// Mock Supabase client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSelectHead = vi.fn();
const mockDeleteChain = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === "rate_limit_entries") {
        return {
          insert: mockInsert,
          select: () => ({
            eq: () => ({
              gte: mockSelectHead,
            }),
          }),
          delete: () => ({
            eq: () => ({
              lt: mockDeleteChain,
            }),
          }),
        };
      }
      return {};
    }),
  }),
}));

describe("checkRateLimit (Supabase-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteChain.mockResolvedValue({ error: null });
  });

  it("should allow request when count is within limit", async () => {
    mockSelectHead.mockResolvedValue({ count: 3, error: null });

    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("user1:chat", 10);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
    expect(mockInsert).toHaveBeenCalledWith({ key: "user1:chat" });
  });

  it("should block request when count exceeds limit", async () => {
    mockSelectHead.mockResolvedValue({ count: 11, error: null });

    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("user1:chat", 10);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should allow request at exactly the limit boundary", async () => {
    mockSelectHead.mockResolvedValue({ count: 10, error: null });

    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("user1:chat", 10);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should fail open on DB error", async () => {
    mockSelectHead.mockResolvedValue({ count: null, error: { message: "DB down" } });

    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("user1:chat", 10);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("should return correct resetAt timestamp", async () => {
    const now = Date.now();
    mockSelectHead.mockResolvedValue({ count: 1, error: null });

    const { checkRateLimit } = await import("./rate-limit");
    const windowMs = 30_000;
    const result = await checkRateLimit("user1:chat", 5, windowMs);

    expect(result.resetAt).toBeGreaterThanOrEqual(now + windowMs - 100);
    expect(result.resetAt).toBeLessThanOrEqual(now + windowMs + 200);
  });
});

describe("getRateLimitKey", () => {
  it("should use userId when provided", () => {
    const request = new Request("https://example.com");
    const key = getRateLimitKey(request, "chat", "user-123");
    expect(key).toBe("user-123:chat");
  });

  it("should extract IP from x-forwarded-for header", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    const key = getRateLimitKey(request, "/api/test");
    expect(key).toBe("192.168.1.1:/api/test");
  });

  it("should use 'unknown' when no forwarded header", () => {
    const request = new Request("https://example.com");
    const key = getRateLimitKey(request, "/api/test");
    expect(key).toBe("unknown:/api/test");
  });

  it("should trim whitespace from IP", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  10.0.0.1  , 192.168.1.1" },
    });
    const key = getRateLimitKey(request, "/api/data");
    expect(key).toBe("10.0.0.1:/api/data");
  });

  it("should handle single IP in forwarded header", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.50" },
    });
    const key = getRateLimitKey(request, "/api/auth");
    expect(key).toBe("203.0.113.50:/api/auth");
  });
});
