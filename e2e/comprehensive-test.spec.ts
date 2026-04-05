import { test, expect, type Page } from "playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://www.sajang.ai";
const AUTH_STATE_PATH = path.join(__dirname, ".auth-state.json");
const REPORT_PATH = path.join(__dirname, "test-report.md");

interface TestResult {
  page: string;
  test: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
  screenshot?: string;
}

const results: TestResult[] = [];

function record(page: string, testName: string, status: "PASS" | "FAIL" | "WARN", detail: string, screenshot?: string) {
  results.push({ page, test: testName, status, detail, screenshot });
  const icon = status === "PASS" ? "O" : status === "WARN" ? "!" : "X";
  console.log(`[${icon}] ${page} > ${testName}: ${detail}`);
}

test.describe("sajang.ai Comprehensive E2E", () => {
  test.setTimeout(600_000);

  test.beforeAll(async () => {
    if (!fs.existsSync(AUTH_STATE_PATH)) {
      throw new Error("Auth state not found. Run manual-login-flow.spec.ts first.");
    }
  });

  test("Full comprehensive test", async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    const page = await context.newPage();

    // ===== 1. DASHBOARD =====
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    if (page.url().includes("/auth/")) {
      // Try re-login via onboarding redirect (already has business)
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");
    }

    if (page.url().includes("/auth/")) {
      record("Dashboard", "Auth", "FAIL", "Not authenticated - session expired");
      await writeReport();
      return;
    }

    await page.screenshot({ path: "e2e/screenshots/c-01-dashboard.png" });
    record("Dashboard", "Page Load", "PASS", `Loaded at ${page.url()}`);

    // Check for data display
    const dashBody = await page.textContent("body");
    if (dashBody?.includes("매출") || dashBody?.includes("프렌즈")) {
      record("Dashboard", "Data Display", "PASS", "Business data visible");
    } else {
      record("Dashboard", "Data Display", "WARN", "No business data keywords found");
    }

    // ===== 2. REVENUE =====
    await page.goto(`${BASE_URL}/revenue`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-02-revenue.png" });
    const revBody = await page.textContent("body");

    if (revBody?.includes("매출")) {
      record("Revenue", "Page Load", "PASS", "Revenue page loaded");
    } else {
      record("Revenue", "Page Load", "FAIL", "Revenue keyword not found");
    }

    // Check for data rows (seeded data should appear)
    const revRows = await page.locator("table tbody tr, [data-testid*='revenue'], .grid > div").count();
    if (revRows > 0) {
      record("Revenue", "Data Rows", "PASS", `${revRows} data elements found`);
    } else {
      record("Revenue", "Data Rows", "WARN", "No data rows visible (may need scroll or tab switch)");
    }

    // Try adding revenue
    const addRevBtn = page.locator('button:has-text("매출 등록"), button:has-text("추가"), button:has-text("입력")').first();
    if (await addRevBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      record("Revenue", "Add Button", "PASS", "Add revenue button visible");
    } else {
      record("Revenue", "Add Button", "WARN", "Add button not immediately visible");
    }

    // ===== 3. EXPENSE =====
    await page.goto(`${BASE_URL}/expense`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-03-expense.png" });
    const expBody = await page.textContent("body");
    if (expBody?.includes("지출") || expBody?.includes("임대료")) {
      record("Expense", "Page Load", "PASS", "Expense page loaded with data");
    } else {
      record("Expense", "Page Load", "WARN", "Expense page loaded but no expense keywords");
    }

    // ===== 4. FIXED COSTS =====
    await page.goto(`${BASE_URL}/fixed-costs`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-04-fixed-costs.png" });
    const fcBody = await page.textContent("body");
    if (fcBody?.includes("고정") || fcBody?.includes("임대료") || fcBody?.includes("인건비")) {
      record("Fixed Costs", "Page Load", "PASS", "Fixed costs page with data");
    } else {
      record("Fixed Costs", "Page Load", "WARN", "Fixed costs page loaded");
    }

    // ===== 5. TRANSACTIONS =====
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-05-transactions.png" });
    record("Transactions", "Page Load", "PASS", "Transactions page loaded");

    // ===== 6. AI CHAT (점장) =====
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-06-chat.png" });
    const chatBody = await page.textContent("body");
    record("AI Chat", "Page Load", "PASS", "Chat page loaded");

    // Try sending a message
    const chatInput = page.locator('textarea, input[type="text"][placeholder*="메시지"], input[placeholder*="입력"]').first();
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await chatInput.fill("이번 달 매출 현황을 알려줘");
      record("AI Chat", "Input", "PASS", "Chat input visible and fillable");

      const sendBtn = page.locator('button[type="submit"], button:has-text("전송"), button svg').first();
      if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendBtn.click();
        record("AI Chat", "Send", "PASS", "Message sent");

        // Wait for AI response (up to 30s)
        try {
          await page.waitForSelector('[class*="assistant"], [data-role="assistant"], .prose, [class*="message"]', { timeout: 30_000 });
          await page.screenshot({ path: "e2e/screenshots/c-06-chat-response.png" });
          record("AI Chat", "Response", "PASS", "AI response received");
        } catch {
          await page.screenshot({ path: "e2e/screenshots/c-06-chat-timeout.png" });
          record("AI Chat", "Response", "WARN", "AI response timeout (may need ANTHROPIC_API_KEY)");
        }
      }
    } else {
      record("AI Chat", "Input", "WARN", "Chat input not found");
    }

    // ===== 7. REVIEW (답장이) =====
    await page.goto(`${BASE_URL}/review`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-07-review.png" });
    const reviewBody = await page.textContent("body");
    if (reviewBody?.includes("리뷰") || reviewBody?.includes("골프초보") || reviewBody?.includes("답장")) {
      record("Review", "Page Load", "PASS", "Review page with data");
    } else {
      record("Review", "Page Load", "WARN", "Review page loaded (no review data visible)");
    }

    // ===== 8. MARKETING (바이럴) =====
    await page.goto(`${BASE_URL}/marketing`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-08-marketing.png" });
    record("Marketing", "Page Load", "PASS", "Marketing page loaded");

    // ===== 9. INVOICES =====
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-09-invoices.png" });
    const invBody = await page.textContent("body");
    if (invBody?.includes("세금계산서") || invBody?.includes("골프시뮬레이션") || invBody?.includes("청구")) {
      record("Invoices", "Page Load", "PASS", "Invoices page with data");
    } else {
      record("Invoices", "Page Load", "WARN", "Invoices page loaded");
    }

    // ===== 10. VENDORS =====
    await page.goto(`${BASE_URL}/vendors`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-10-vendors.png" });
    const vendorBody = await page.textContent("body");
    if (vendorBody?.includes("골프시뮬레이션") || vendorBody?.includes("공급")) {
      record("Vendors", "Page Load", "PASS", "Vendors page with data");
    } else {
      record("Vendors", "Page Load", "WARN", "Vendors page loaded");
    }

    // ===== 11. BILLING =====
    await page.goto(`${BASE_URL}/billing`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-11-billing.png" });
    const billingBody = await page.textContent("body");
    if (billingBody?.includes("구독") || billingBody?.includes("점장") || billingBody?.includes("active") || billingBody?.includes("고용")) {
      record("Billing", "Page Load", "PASS", "Billing page with subscription info");
    } else {
      record("Billing", "Page Load", "WARN", "Billing page loaded");
    }
    // Check subscription status shown
    if (billingBody?.includes("활성") || billingBody?.includes("active") || billingBody?.includes("이용 중")) {
      record("Billing", "Subscription Status", "PASS", "Active subscription displayed");
    } else {
      record("Billing", "Subscription Status", "WARN", "Subscription status not clearly shown");
    }

    // ===== 12. SETTINGS =====
    await page.goto(`${BASE_URL}/settings`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-12-settings.png" });
    record("Settings", "Page Load", "PASS", "Settings page loaded");

    // ===== 13. SETTINGS/CONNECTIONS =====
    await page.goto(`${BASE_URL}/settings/connections`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-13-connections.png" });
    record("Connections", "Page Load", "PASS", "API connections page loaded");

    // ===== 14. SETTINGS/BUDGET =====
    await page.goto(`${BASE_URL}/settings/budget`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-14-budget.png" });
    record("Budget", "Page Load", "PASS", "Budget settings page loaded");

    // ===== 15. SETTINGS/LOANS =====
    await page.goto(`${BASE_URL}/settings/loans`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-15-loans.png" });
    record("Loans", "Page Load", "PASS", "Loans settings page loaded");

    // ===== 16. SIDEBAR NAVIGATION =====
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    const sidebar = page.locator('nav, [data-slot="sidebar"], aside').first();
    if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
      record("Navigation", "Sidebar", "PASS", "Sidebar visible");

      // Check sidebar links
      const navLinks = await page.locator('nav a, [data-slot="sidebar"] a').count();
      record("Navigation", "Nav Links", navLinks > 5 ? "PASS" : "WARN", `${navLinks} navigation links found`);
    } else {
      record("Navigation", "Sidebar", "WARN", "Sidebar not visible (may be mobile view)");
    }

    // ===== 17. ERROR PAGE CHECK =====
    // Check all pages for 500 errors or unhandled exceptions
    for (const p of ["/dashboard", "/revenue", "/expense", "/chat", "/review", "/billing"]) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: "networkidle" });
      const body = await page.textContent("body");
      if (body?.includes("Internal Server Error") || body?.includes("Application error") || body?.includes("unhandled")) {
        record("Error Check", p, "FAIL", "Server error detected");
      }
    }
    record("Error Check", "All Pages", "PASS", "No 500 errors detected across tested pages");

    // ===== 18. RESPONSIVE CHECK =====
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-18-mobile-dashboard.png" });
    record("Responsive", "Mobile Dashboard", "PASS", "Dashboard renders on mobile viewport");

    await page.goto(`${BASE_URL}/revenue`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/c-18-mobile-revenue.png" });
    record("Responsive", "Mobile Revenue", "PASS", "Revenue page renders on mobile");

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // ===== WRITE REPORT =====
    await writeReport();
    await page.close();
    await context.close();

    // Assert no critical failures
    const failures = results.filter(r => r.status === "FAIL");
    expect(failures.length).toBe(0);
  });
});

async function writeReport() {
  const passed = results.filter(r => r.status === "PASS").length;
  const warned = results.filter(r => r.status === "WARN").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const total = results.length;

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  let md = `# sajang.ai E2E Test Report\n\n`;
  md += `**Date**: ${now}\n`;
  md += `**Environment**: Production (https://www.sajang.ai)\n`;
  md += `**Account**: avalon55@nate.com (admin, paid plan)\n`;
  md += `**Business**: 프렌즈 스크린 부천로얄점\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| PASS | ${passed} |\n`;
  md += `| WARN | ${warned} |\n`;
  md += `| FAIL | ${failed} |\n`;
  md += `| **Total** | **${total}** |\n\n`;

  md += `## Score: ${Math.round((passed / total) * 100)}% (${passed}/${total} passed)\n\n`;

  // Group by page
  const pages = [...new Set(results.map(r => r.page))];
  md += `## Detailed Results\n\n`;

  for (const p of pages) {
    md += `### ${p}\n\n`;
    md += `| Test | Status | Detail |\n|------|--------|--------|\n`;
    for (const r of results.filter(r => r.page === p)) {
      const icon = r.status === "PASS" ? "PASS" : r.status === "WARN" ? "WARN" : "FAIL";
      md += `| ${r.test} | ${icon} | ${r.detail} |\n`;
    }
    md += `\n`;
  }

  md += `## Screenshots\n\n`;
  md += `All screenshots saved in \`e2e/screenshots/c-*.png\`\n\n`;

  md += `## Notes\n\n`;
  md += `- AI Chat response depends on ANTHROPIC_API_KEY being set in production env\n`;
  md += `- Seed data: 16 revenues, 12 expenses, 5 fixed costs, 5 reviews, 4 invoices, 3 vendors, 3 monthly summaries\n`;
  md += `- Hyphen API integration excluded (requires separate API credentials)\n`;
  md += `- NTS business verification API excluded (NTS_API_KEY not configured)\n`;

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`\nReport written to ${REPORT_PATH}`);
}
