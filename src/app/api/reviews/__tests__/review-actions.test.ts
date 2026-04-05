import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Chainable Supabase mock builder
// ---------------------------------------------------------------------------
type MockRow = Record<string, unknown>;

function createChainMock(resolvedData: MockRow | null = null, resolvedError: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const terminal = vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError });

  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = terminal;

  return chain;
}

// Mutable mock state — each test can override via `configureSupabase()`
let mockUser: { id: string } | null = null;
let reviewChain = createChainMock();
let businessChain = createChainMock();
let updateChain = createChainMock();
let callIndex = 0;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
      }),
    },
    from: vi.fn().mockImplementation(() => {
      callIndex++;
      // 1st from() = review lookup, 2nd = business ownership, 3rd = update
      if (callIndex === 1) return reviewChain;
      if (callIndex === 2) return businessChain;
      return updateChain;
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function configureSupabase(opts: {
  user?: { id: string } | null;
  review?: MockRow | null;
  business?: MockRow | null;
  updateError?: unknown;
}) {
  mockUser = opts.user ?? null;
  reviewChain = createChainMock(opts.review ?? null);
  businessChain = createChainMock(opts.business ?? null);
  updateChain = createChainMock(null, opts.updateError ?? null);
  callIndex = 0;
}

function makeRequest(method: string, body?: Record<string, unknown>) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest("http://localhost/api/reviews/rev-1/" + (method === "PATCH" ? "reply" : "publish"), init);
}

// ---------------------------------------------------------------------------
// Reply route tests (PATCH)
// ---------------------------------------------------------------------------
describe("PATCH /api/reviews/[id]/reply", () => {
  let PATCH: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    callIndex = 0;
    const mod = await import("../[id]/reply/route");
    PATCH = mod.PATCH;
  });

  it("returns 401 when not authenticated", async () => {
    configureSupabase({ user: null });
    const res = await PATCH(makeRequest("PATCH", { aiReply: "hi" }), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("인증");
  });

  it("returns 400 for invalid input (empty aiReply)", async () => {
    configureSupabase({ user: { id: "u1" }, review: { business_id: "b1" }, business: { id: "b1" } });
    const res = await PATCH(makeRequest("PATCH", { aiReply: "" }), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when review not found", async () => {
    configureSupabase({ user: { id: "u1" }, review: null });
    const res = await PATCH(makeRequest("PATCH", { aiReply: "good food" }), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when business ownership fails (IDOR protection)", async () => {
    configureSupabase({ user: { id: "u1" }, review: { business_id: "b-other" }, business: null });
    const res = await PATCH(makeRequest("PATCH", { aiReply: "good food" }), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 200 on successful reply update", async () => {
    configureSupabase({ user: { id: "u1" }, review: { business_id: "b1" }, business: { id: "b1" } });
    const res = await PATCH(makeRequest("PATCH", { aiReply: "Thank you for your review!" }), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Publish route tests (POST)
// ---------------------------------------------------------------------------
describe("POST /api/reviews/[id]/publish", () => {
  let POST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    callIndex = 0;
    const mod = await import("../[id]/publish/route");
    POST = mod.POST;
  });

  it("returns 401 when not authenticated", async () => {
    configureSupabase({ user: null });
    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when review not found", async () => {
    configureSupabase({ user: { id: "u1" }, review: null });
    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when business ownership fails (IDOR protection)", async () => {
    configureSupabase({
      user: { id: "u1" },
      review: { ai_reply: "hello", reply_status: "draft", business_id: "b-other" },
      business: null,
    });
    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when no ai_reply exists", async () => {
    configureSupabase({
      user: { id: "u1" },
      review: { ai_reply: null, reply_status: "draft", business_id: "b1" },
      business: { id: "b1" },
    });
    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("AI 답글");
  });

  it("returns 400 when already published", async () => {
    configureSupabase({
      user: { id: "u1" },
      review: { ai_reply: "hi", reply_status: "published", business_id: "b1" },
      business: { id: "b1" },
    });
    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("이미 발행");
  });

  it("returns 200 on successful publish", async () => {
    configureSupabase({
      user: { id: "u1" },
      review: { ai_reply: "Thank you!", reply_status: "draft", business_id: "b1" },
      business: { id: "b1" },
    });
    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ id: "rev-1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
