/**
 * Shared mock Supabase client for API route testing.
 *
 * Provides a chainable mock that mimics the Supabase PostgREST query builder,
 * allowing tests to control auth state and database responses independently.
 */
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MockQueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code: string } | null;
}

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

export interface MockSupabaseClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

/**
 * Create a chainable query builder that resolves to the given result on
 * terminal calls (.single(), or the last .eq()).
 *
 * Every chainable method returns the builder itself so that
 * `supabase.from('t').select('*').eq('id', x).single()` works as expected.
 */
export function createMockQueryBuilder(
  result: MockQueryResult = { data: null, error: null }
): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  // Every method returns the builder itself for chaining
  builder.select.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);

  // Terminal: .single() resolves the final result
  builder.single.mockResolvedValue(result);

  return builder;
}

/**
 * Create a full mock Supabase client.
 *
 * Usage:
 * ```ts
 * const { mockSupabase, setUser, setQueryResults } = createMockSupabaseClient();
 * setUser({ id: "user-1", email: "a@b.com" });
 * setQueryResults("delivery_reviews", { data: { id: "r1" }, error: null });
 * ```
 */
export function createMockSupabaseClient() {
  const queryBuilders = new Map<string, MockQueryBuilder>();

  const mockSupabase: MockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (!queryBuilders.has(table)) {
        queryBuilders.set(table, createMockQueryBuilder());
      }
      return queryBuilders.get(table)!;
    }),
  };

  /**
   * Set the authenticated user. Pass `null` to simulate unauthenticated.
   */
  function setUser(user: { id: string; email?: string } | null) {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
  }

  /**
   * Configure the query builder for a given table so that terminal calls
   * (.single()) resolve to the provided result.
   *
   * Calling this multiple times for the same table replaces the builder.
   */
  function setQueryResult(
    table: string,
    result: MockQueryResult
  ): MockQueryBuilder {
    const builder = createMockQueryBuilder(result);
    queryBuilders.set(table, builder);
    return builder;
  }

  /**
   * Configure per-call results for a table. Each call to `.single()` will
   * resolve to the next result in the array (useful when a route queries
   * the same table multiple times with different filters).
   */
  function setQueryResultSequence(
    table: string,
    results: MockQueryResult[]
  ): MockQueryBuilder {
    const builder = createMockQueryBuilder();
    let callIndex = 0;
    builder.single.mockImplementation(() => {
      const result = results[callIndex] ?? results[results.length - 1];
      callIndex++;
      return Promise.resolve(result);
    });
    queryBuilders.set(table, builder);
    return builder;
  }

  return {
    mockSupabase,
    setUser,
    setQueryResult,
    setQueryResultSequence,
  };
}

// ---------------------------------------------------------------------------
// Module mock installer
// ---------------------------------------------------------------------------

/**
 * Install the Supabase server mock.
 *
 * Call at the top of your test file BEFORE importing the route handler:
 * ```ts
 * const { mockSupabase, setUser, setQueryResult } = installSupabaseMock();
 * ```
 */
export function installSupabaseMock() {
  const helpers = createMockSupabaseClient();

  vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(() => Promise.resolve(helpers.mockSupabase)),
  }));

  return helpers;
}
