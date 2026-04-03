// Chat Tool Use definitions for 점장 conversational AI
// 9 tools enabling real-time business data queries during chat sessions
// Uses AI SDK v6 tool() with inputSchema (zodSchema wrapper) pattern

import { z } from "zod";
import { tool, zodSchema } from "ai";
import { createClient } from "@/lib/supabase/server";
import { predictCashFlow } from "./cashflow-predictor";

// @MX:ANCHOR: Chat tool registry - all tool definitions for chat endpoint
// @MX:REASON: Fan-in from chat route (POST) - tools are passed to streamText

/**
 * Create a set of business-aware tools scoped to a specific business.
 * All tools query Supabase directly for real-time data.
 *
 * @param businessId - UUID of the business to scope all queries to
 */
export function createChatTools(businessId: string) {
  // --- Schemas ---
  const snapshotSchema = z.object({});
  const revenueSchema = z.object({
    periodStart: z.string().describe("시작일 YYYY-MM-DD"),
    periodEnd: z.string().describe("종료일 YYYY-MM-DD"),
    groupBy: z.enum(["channel", "daily", "none"]).optional().default("none"),
  });
  const expenseSchema = z.object({
    periodStart: z.string(),
    periodEnd: z.string(),
    category: z.string().optional(),
  });
  const reviewSchema = z.object({
    days: z.number().optional().default(30),
    platform: z
      .enum(["baemin", "coupangeats", "yogiyo", "all"])
      .optional()
      .default("all"),
  });
  const cashFlowSchema = z.object({});
  const compareSchema = z.object({
    currentStart: z.string(),
    currentEnd: z.string(),
    previousStart: z.string(),
    previousEnd: z.string(),
  });
  const invoicesSchema = z.object({
    type: z.enum(["receivable", "payable", "all"]).optional().default("all"),
  });

  return {
    /**
     * Tool 1: Business snapshot - current business status at a glance
     */
    getBusinessSnapshot: tool({
      description:
        "사업장 현재 경영 상태 스냅샷. '요즘 장사 어때?', '현황 알려줘' 같은 일반 질문에 사용",
      inputSchema: zodSchema(snapshotSchema),
      execute: async (_input: z.infer<typeof snapshotSchema>) => {
        const supabase = await createClient();
        const today = new Date().toISOString().split("T")[0];
        const thisMonth = today.substring(0, 7);
        const prevMonth = (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - 1);
          return d.toISOString().substring(0, 7);
        })();

        const [thisMonthResult, prevMonthResult, expenseResult, reviewResult] =
          await Promise.all([
            supabase
              .from("revenues")
              .select("amount")
              .eq("business_id", businessId)
              .gte("date", `${thisMonth}-01`)
              .lte("date", `${thisMonth}-31`),
            supabase
              .from("revenues")
              .select("amount")
              .eq("business_id", businessId)
              .gte("date", `${prevMonth}-01`)
              .lte("date", `${prevMonth}-31`),
            supabase
              .from("expenses")
              .select("amount")
              .eq("business_id", businessId)
              .gte("date", `${thisMonth}-01`)
              .lte("date", `${thisMonth}-31`),
            supabase
              .from("delivery_reviews")
              .select("rating")
              .eq("business_id", businessId)
              .gte("review_date", `${thisMonth}-01`),
          ]);

        const thisRevenue = (thisMonthResult.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );
        const prevRevenue = (prevMonthResult.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );
        const expenses = (expenseResult.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );
        const reviews = reviewResult.data ?? [];
        const avgRating =
          reviews.length > 0
            ? Math.round(
                (reviews.reduce((s, r) => s + Number(r.rating), 0) /
                  reviews.length) *
                  10
              ) / 10
            : null;

        const growthRate =
          prevRevenue > 0
            ? Math.round(((thisRevenue - prevRevenue) / prevRevenue) * 100)
            : null;

        return {
          thisMonthRevenue: thisRevenue,
          prevMonthRevenue: prevRevenue,
          revenueGrowthRate: growthRate,
          thisMonthExpenses: expenses,
          estimatedNetProfit: thisRevenue - expenses,
          avgRating,
          reviewCount: reviews.length,
        };
      },
    }),

    /**
     * Tool 2: Revenue query with grouping options
     */
    queryRevenue: tool({
      description:
        "매출 데이터 조회. 일별/주별/월별 집계, 채널별 분석 가능. '이번달 매출', '배달 매출 추이'에 사용",
      inputSchema: zodSchema(revenueSchema),
      execute: async (input: z.infer<typeof revenueSchema>) => {
        const { periodStart, periodEnd, groupBy = "none" } = input;
        const supabase = await createClient();

        const { data, error } = await supabase
          .from("revenues")
          .select("amount, date, channel, category")
          .eq("business_id", businessId)
          .gte("date", periodStart)
          .lte("date", periodEnd)
          .order("date", { ascending: true });

        if (error ?? !data) {
          return {
            total: 0,
            breakdown: [] as Array<{ key: string; amount: number }>,
            count: 0,
          };
        }

        const total = data.reduce((s, r) => s + Number(r.amount), 0);
        const count = data.length;

        let breakdown: Array<{ key: string; amount: number }> = [];

        if (groupBy === "channel") {
          const grouped: Record<string, number> = {};
          for (const r of data) {
            const ch = r.channel ?? "기타";
            grouped[ch] = (grouped[ch] ?? 0) + Number(r.amount);
          }
          breakdown = Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .map(([key, amount]) => ({ key, amount }));
        } else if (groupBy === "daily") {
          const grouped: Record<string, number> = {};
          for (const r of data) {
            grouped[r.date] = (grouped[r.date] ?? 0) + Number(r.amount);
          }
          breakdown = Object.entries(grouped).map(([key, amount]) => ({
            key,
            amount,
          }));
        }

        return { total, breakdown, count };
      },
    }),

    /**
     * Tool 3: Expense query by category
     */
    queryExpenses: tool({
      description:
        "비용 상세 조회. 9대 분류별 분석. '비용 많이 나가는 항목', '식자재비 추이'에 사용",
      inputSchema: zodSchema(expenseSchema),
      execute: async (input: z.infer<typeof expenseSchema>) => {
        const { periodStart, periodEnd, category } = input;
        const supabase = await createClient();

        let expenseQuery = supabase
          .from("expenses")
          .select("amount, category, type, date")
          .eq("business_id", businessId)
          .gte("date", periodStart)
          .lte("date", periodEnd);

        if (category) {
          expenseQuery = expenseQuery.eq("category", category);
        }

        const fixedQuery = supabase
          .from("fixed_costs")
          .select("amount, category")
          .eq("business_id", businessId);

        const [expenseResult, fixedResult] = await Promise.all([
          expenseQuery,
          fixedQuery,
        ]);

        const expenses = expenseResult.data ?? [];
        const fixedCosts = fixedResult.data ?? [];

        const categoryTotals: Record<string, number> = {};
        for (const e of expenses) {
          const cat = e.category ?? "기타";
          categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(e.amount);
        }
        for (const f of fixedCosts) {
          const cat = f.category ?? "고정비";
          categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(f.amount);
        }

        const total = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
        const breakdown = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amount]) => ({ category: cat, amount }));

        return { total, breakdown, variableExpenseCount: expenses.length };
      },
    }),

    /**
     * Tool 4: Review analysis
     */
    getReviewAnalysis: tool({
      description:
        "리뷰 분석. 플랫폼별/카테고리별 분포, 감성 추이. '리뷰 어때?', '불만이 뭐야?'에 사용",
      inputSchema: zodSchema(reviewSchema),
      execute: async (input: z.infer<typeof reviewSchema>) => {
        const { days = 30, platform = "all" } = input;
        const supabase = await createClient();
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().split("T")[0];

        let query = supabase
          .from("delivery_reviews")
          .select(
            "rating, platform, reply_status, sentiment_score, keywords, review_date"
          )
          .eq("business_id", businessId)
          .gte("review_date", sinceStr);

        if (platform !== "all") {
          query = query.eq("platform", platform);
        }

        const { data } = await query;
        const reviews = data ?? [];

        if (reviews.length === 0) {
          return {
            count: 0,
            avgRating: 0,
            ratingDistribution: {} as Record<string, number>,
            platformBreakdown: {} as Record<
              string,
              { count: number; avgRating: number }
            >,
            topKeywords: [] as Array<{ keyword: string; count: number }>,
            pendingCount: 0,
            responseRate: 0,
          };
        }

        const ratingDist: Record<string, number> = {};
        for (const r of reviews) {
          const key = String(Math.round(Number(r.rating)));
          ratingDist[key] = (ratingDist[key] ?? 0) + 1;
        }

        const platformBreakdown: Record<
          string,
          { count: number; avgRating: number }
        > = {};
        for (const r of reviews) {
          const p = r.platform ?? "unknown";
          if (!platformBreakdown[p]) {
            platformBreakdown[p] = { count: 0, avgRating: 0 };
          }
          platformBreakdown[p].count++;
          platformBreakdown[p].avgRating += Number(r.rating);
        }
        for (const p of Object.keys(platformBreakdown)) {
          platformBreakdown[p].avgRating =
            Math.round(
              (platformBreakdown[p].avgRating / platformBreakdown[p].count) *
                10
            ) / 10;
        }

        const keywordCounts: Record<string, number> = {};
        for (const r of reviews) {
          const kws = Array.isArray(r.keywords) ? (r.keywords as string[]) : [];
          if (Number(r.rating) <= 3) {
            for (const kw of kws) {
              if (kw) keywordCounts[kw] = (keywordCounts[kw] ?? 0) + 1;
            }
          }
        }
        const topKeywords = Object.entries(keywordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([keyword, count]) => ({ keyword, count }));

        const avgRating =
          Math.round(
            (reviews.reduce((s, r) => s + Number(r.rating), 0) /
              reviews.length) *
              10
          ) / 10;

        const pendingCount = reviews.filter(
          (r) => r.reply_status === "pending" || r.reply_status === "draft"
        ).length;

        const repliedCount = reviews.filter(
          (r) =>
            r.reply_status === "auto_published" ||
            r.reply_status === "published"
        ).length;

        const responseRate = Math.round((repliedCount / reviews.length) * 100);

        return {
          count: reviews.length,
          avgRating,
          ratingDistribution: ratingDist,
          platformBreakdown,
          topKeywords,
          pendingCount,
          responseRate,
        };
      },
    }),

    /**
     * Tool 5: Cash flow forecast for next 14 days
     */
    getCashFlowForecast: tool({
      description:
        "향후 14일 자금 흐름 예측. '돈 빠듯해?', '현금 괜찮아?'에 사용",
      inputSchema: zodSchema(cashFlowSchema),
      execute: async (_input: z.infer<typeof cashFlowSchema>) => {
        try {
          const forecast = await predictCashFlow(businessId);
          return {
            riskLevel: forecast.overallRisk,
            lowestBalance: forecast.summary.lowestProjectedBalance,
            alertThreshold: forecast.summary.alertThreshold,
            alertDays: forecast.alertDays.slice(0, 3),
            nextWeekSummary: forecast.dailyProjections
              .slice(0, 7)
              .map((d) => ({
                date: d.date,
                income: d.expectedIncome,
                expense: d.expectedExpense,
                balance: d.projectedBalance,
                risk: d.riskLevel,
              })),
          };
        } catch {
          return {
            riskLevel: "safe" as const,
            lowestBalance: 0,
            alertThreshold: 1000000,
            alertDays: [] as string[],
            nextWeekSummary: [] as Array<{
              date: string;
              income: number;
              expense: number;
              balance: number;
              risk: string;
            }>,
            error: "자금 흐름 예측 데이터가 없습니다",
          };
        }
      },
    }),

    /**
     * Tool 6: Period comparison analysis
     */
    comparePeriods: tool({
      description:
        "두 기간 비교 분석. '지난달이랑 비교', '작년 같은 달 비교'에 사용",
      inputSchema: zodSchema(compareSchema),
      execute: async (input: z.infer<typeof compareSchema>) => {
        const { currentStart, currentEnd, previousStart, previousEnd } = input;
        const supabase = await createClient();

        const [
          currentRevenue,
          previousRevenue,
          currentExpense,
          previousExpense,
        ] = await Promise.all([
          supabase
            .from("revenues")
            .select("amount")
            .eq("business_id", businessId)
            .gte("date", currentStart)
            .lte("date", currentEnd),
          supabase
            .from("revenues")
            .select("amount")
            .eq("business_id", businessId)
            .gte("date", previousStart)
            .lte("date", previousEnd),
          supabase
            .from("expenses")
            .select("amount")
            .eq("business_id", businessId)
            .gte("date", currentStart)
            .lte("date", currentEnd),
          supabase
            .from("expenses")
            .select("amount")
            .eq("business_id", businessId)
            .gte("date", previousStart)
            .lte("date", previousEnd),
        ]);

        const currRev = (currentRevenue.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );
        const prevRev = (previousRevenue.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );
        const currExp = (currentExpense.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );
        const prevExp = (previousExpense.data ?? []).reduce(
          (s, r) => s + Number(r.amount),
          0
        );

        const revenueChange =
          prevRev > 0
            ? Math.round(((currRev - prevRev) / prevRev) * 100)
            : null;
        const expenseChange =
          prevExp > 0
            ? Math.round(((currExp - prevExp) / prevExp) * 100)
            : null;
        const prevNetProfit = prevRev - prevExp;
        const profitChange =
          prevNetProfit !== 0
            ? Math.round(
                ((currRev - currExp - prevNetProfit) /
                  Math.abs(prevNetProfit)) *
                  100
              )
            : null;

        return {
          current: {
            period: `${currentStart} ~ ${currentEnd}`,
            revenue: currRev,
            expense: currExp,
            netProfit: currRev - currExp,
          },
          previous: {
            period: `${previousStart} ~ ${previousEnd}`,
            revenue: prevRev,
            expense: prevExp,
            netProfit: prevRev - prevExp,
          },
          changes: {
            revenueChangeRate: revenueChange,
            expenseChangeRate: expenseChange,
            profitChangeRate: profitChange,
          },
        };
      },
    }),

    /**
     * Tool 7: Invoices and receivables status
     */
    getInvoicesAndReceivables: tool({
      description: "미수금/미지급금 현황. '밀린 돈 있어?'에 사용",
      inputSchema: zodSchema(invoicesSchema),
      execute: async (input: z.infer<typeof invoicesSchema>) => {
        // Invoices table may not exist yet - handle gracefully
        return {
          totalReceivable: 0,
          totalPayable: 0,
          overdueReceivable: 0,
          overduePayable: 0,
          items: [] as unknown[],
          note: "미수금/미지급금 기능은 준비 중입니다. 현재 매출/비용 데이터로 확인 가능합니다",
          requestedType: input.type ?? "all",
        };
      },
    }),

    /**
     * Tool 8: Cost diagnosis against industry benchmarks (data farm)
     */
    getCostDiagnosis: tool({
      description:
        "내 비용이 동종 업계 대비 비싼 곳을 찾습니다. '돈 어디서 새?', '비용 줄일 데 없어?', '비용 많이 나가는지 봐줘'에 사용",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { diagnoseCosts } = await import("@/lib/ai/data-farm");
        return diagnoseCosts(businessId);
      },
    }),

    /**
     * Tool 9: Rent benchmark comparison using public data
     */
    getRentBenchmark: tool({
      description:
        "임대료가 적정한지 공공 데이터 기반으로 비교. '임대료 비싸?', '월세 적당한지 봐줘'에 사용",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { getRentBenchmark: fetchRentBenchmark } = await import(
          "@/lib/public-data/rent-benchmark"
        );
        // Use base select (only known columns) + cast to access new columns
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabaseAny = (await createClient()) as any;
        const { data } = await supabaseAny
          .from("businesses")
          .select("address, area_sqm")
          .eq("id", businessId)
          .single();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = data as Record<string, any> | null;
        if (!row?.address) {
          return { message: "주소 정보가 없어 임대료 비교가 불가합니다." };
        }
        const result = await fetchRentBenchmark(
          row.address as string,
          (row.area_sqm as number | null) ?? 33
        );
        if (!result) {
          return { message: "임대료 비교 데이터를 아직 준비 중입니다. 곧 서비스될 예정입니다." };
        }
        return result;
      },
    }),

    getLoanSummary: tool({
      description:
        "Get loan summary: total debt, monthly payments, and individual loan balances. " +
        "Use when the user asks about 대출, 부채, 상환, 이자, or loan status.",
      inputSchema: zodSchema(z.object({})),
      execute: async () => {
        const { getLoanSummary } = await import("@/lib/queries/loan");
        return getLoanSummary(businessId);
      },
    }),

    getBudgetComparison: tool({
      description:
        "Compare budget targets vs actual spending for a given month. " +
        "Use when the user asks about 예산, 목표, 달성률, or budget performance.",
      inputSchema: zodSchema(z.object({
        year: z.number().describe("Year (e.g. 2026)"),
        month: z.number().min(1).max(12).describe("Month (1-12)"),
      })),
      execute: async (input: { year: number; month: number }) => {
        const { getBudgetComparison } = await import("@/lib/queries/budget");
        return getBudgetComparison(businessId, input.year, input.month);
      },
    }),

    getDailyCumulative: tool({
      description:
        "Get daily revenue with 7-day moving average and cumulative total. " +
        "Use when the user asks about 일별 매출 추이, 이동평균, 누적매출.",
      inputSchema: zodSchema(z.object({
        year: z.number().describe("Year"),
        month: z.number().min(1).max(12).describe("Month"),
      })),
      execute: async (input: { year: number; month: number }) => {
        const { getDailyCumulative } = await import("@/lib/queries/daily-cumulative");
        return getDailyCumulative(businessId, input.year, input.month);
      },
    }),
  };
}
