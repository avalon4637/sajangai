import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getRateLimitKey } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset the internal store by using unique keys per test
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow the first request", () => {
    const result = checkRateLimit("test:first", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should allow requests within the limit", () => {
    const key = "test:within-limit";
    const limit = 3;

    const r1 = checkRateLimit(key, limit);
    const r2 = checkRateLimit(key, limit);
    const r3 = checkRateLimit(key, limit);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("should block request exceeding limit", () => {
    const key = "test:exceed-limit";
    const limit = 2;

    checkRateLimit(key, limit);
    checkRateLimit(key, limit);
    const r3 = checkRateLimit(key, limit);

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("should reset window after expiry", () => {
    const key = "test:window-reset";
    const limit = 1;
    const windowMs = 1000;

    const r1 = checkRateLimit(key, limit, windowMs);
    expect(r1.allowed).toBe(true);

    const r2 = checkRateLimit(key, limit, windowMs);
    expect(r2.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1001);

    const r3 = checkRateLimit(key, limit, windowMs);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0); // limit - 1 = 0
  });

  it("should keep different keys independent", () => {
    const limit = 1;

    const r1 = checkRateLimit("key-a:route", limit);
    expect(r1.allowed).toBe(true);

    const r2 = checkRateLimit("key-b:route", limit);
    expect(r2.allowed).toBe(true);

    // key-a should be blocked now
    const r3 = checkRateLimit("key-a:route", limit);
    expect(r3.allowed).toBe(false);

    // key-b should also be blocked
    const r4 = checkRateLimit("key-b:route", limit);
    expect(r4.allowed).toBe(false);
  });

  it("should return correct resetAt timestamp", () => {
    const now = Date.now();
    const windowMs = 30_000;
    const result = checkRateLimit("test:reset-at", 5, windowMs);
    // resetAt should be approximately now + windowMs
    expect(result.resetAt).toBeGreaterThanOrEqual(now + windowMs - 100);
    expect(result.resetAt).toBeLessThanOrEqual(now + windowMs + 100);
  });
});

describe("getRateLimitKey", () => {
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
