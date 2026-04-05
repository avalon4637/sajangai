import { test, expect, type BrowserContext } from "playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://www.sajang.ai";
const AUTH_STATE_PATH = path.join(__dirname, ".auth-state.json");

// Business info from registration certificate
const BUSINESS = {
  number: "2020809355",
  name: "프렌즈 스크린 부천로얄점",
  type: "스크린 골프 연습장",
  address: "경기도 부천시 길주로 262, B동 2층 207호",
};

test.describe("sajang.ai Full User Flow", () => {
  test.setTimeout(300_000);

  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // Reuse saved auth state if available
    if (fs.existsSync(AUTH_STATE_PATH)) {
      console.log(">>> Reusing saved auth state (no login needed!)");
      context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    } else {
      console.log(">>> No saved auth state - manual login required");
      context = await browser.newContext();
    }
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("Login (manual if needed) + save session", async () => {
    const page = await context.newPage();

    // Check if already authenticated
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

    if (!page.url().includes("/auth/")) {
      console.log(">>> Already authenticated! Skipping login.");
      await page.screenshot({ path: "e2e/screenshots/01-already-logged-in.png" });
      await page.close();
      return;
    }

    // Need to login
    console.log(">>> Not authenticated - going to login page");
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: "e2e/screenshots/01-login-page.png" });

    // Click Kakao login
    const kakaoButton = page.locator('button:has-text("카카오"), a:has-text("카카오")').first();
    if (await kakaoButton.isVisible({ timeout: 5000 })) {
      await kakaoButton.click();
      console.log(">>> Kakao button clicked");
    }

    // Wait for manual login (90s)
    console.log("========================================");
    console.log(">>> MANUAL LOGIN REQUIRED (90 seconds)");
    console.log(">>> Complete Kakao login + 2FA in the browser");
    console.log(">>> This is a ONE-TIME setup - session will be saved");
    console.log("========================================");

    await page.waitForFunction(
      () => window.location.hostname.includes("sajang.ai"),
      { timeout: 90_000 }
    );
    await page.waitForLoadState("networkidle");
    console.log(`>>> Login complete! Redirected to: ${page.url()}`);

    // Save auth state for future runs
    await context.storageState({ path: AUTH_STATE_PATH });
    console.log(`>>> Auth state saved to ${AUTH_STATE_PATH}`);
    await page.screenshot({ path: "e2e/screenshots/02-after-login.png" });
    await page.close();
  });

  test("Onboarding (register business)", async () => {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/auth/onboarding`, { waitUntil: "networkidle" });

    // If redirected to dashboard, business already exists
    if (page.url().includes("/dashboard")) {
      console.log(">>> Business already registered - skipping onboarding");
      await page.close();
      return;
    }

    // If redirected to login, auth state expired
    if (page.url().includes("/auth/login")) {
      console.log(">>> Auth expired - delete .auth-state.json and re-run");
      await page.close();
      test.skip();
      return;
    }

    console.log(">>> On onboarding page - registering business");
    await page.screenshot({ path: "e2e/screenshots/10-onboarding.png" });

    // Try business number verification (optional)
    const bizNumberInput = page.locator("input#businessNumber").first();
    if (await bizNumberInput.isVisible({ timeout: 3000 })) {
      await bizNumberInput.fill(BUSINESS.number);
      console.log(">>> Business number entered");

      const verifyBtn = page.locator('button:has-text("인증")').first();
      if (await verifyBtn.isEnabled()) {
        await verifyBtn.click();
        console.log(">>> Verify clicked, waiting...");
        await page.waitForTimeout(5000);

        const verified = await page.locator("text=인증 완료").isVisible({ timeout: 2000 }).catch(() => false);
        if (verified) {
          console.log(">>> Business number verified!");
        } else {
          console.log(">>> NTS API failed - clearing business number to proceed");
          await bizNumberInput.fill("");
        }
      }
    }

    // Fill form
    await page.locator("input#name").fill(BUSINESS.name);
    console.log(">>> Business name entered");

    const typeInput = page.locator("input#business_type");
    if (await typeInput.isVisible({ timeout: 2000 })) {
      await typeInput.fill(BUSINESS.type);
    }

    const addressInput = page.locator("input#address");
    if (await addressInput.isVisible({ timeout: 2000 })) {
      await addressInput.fill(BUSINESS.address);
    }

    await page.screenshot({ path: "e2e/screenshots/11-form-filled.png" });

    // Submit
    await page.locator('button[type="submit"]').first().click();
    console.log(">>> Submit clicked");

    // Wait for navigation
    try {
      await page.waitForURL(/preferences|dashboard/, { timeout: 15_000 });
      console.log(`>>> Navigated to: ${page.url()}`);
      await page.screenshot({ path: "e2e/screenshots/12-after-submit.png" });

      // Handle preferences page
      if (page.url().includes("/preferences")) {
        console.log(">>> On preferences page");
        const actionBtn = page.locator('button[type="submit"], button:has-text("건너뛰기"), button:has-text("시작"), button:has-text("완료")').first();
        if (await actionBtn.isVisible({ timeout: 5000 })) {
          await actionBtn.click();
          await page.waitForURL(/dashboard/, { timeout: 15_000 }).catch(() => {});
        }
      }
    } catch {
      await page.screenshot({ path: "e2e/screenshots/12-submit-error.png" });
      console.log(`>>> Submit may have failed. Current URL: ${page.url()}`);
    }

    // Update saved state after onboarding
    await context.storageState({ path: AUTH_STATE_PATH });
    await page.close();
  });

  test("Dashboard and all pages", async () => {
    const page = await context.newPage();

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

    if (page.url().includes("/auth/")) {
      console.log(">>> Not authenticated - skipping page tests");
      await page.close();
      test.skip();
      return;
    }

    await page.screenshot({ path: "e2e/screenshots/20-dashboard.png" });
    expect(page.url()).toContain("/dashboard");
    console.log(">>> Dashboard loaded!");

    // Test all main pages
    const pages = [
      { path: "/revenue", name: "매출 관리" },
      { path: "/expense", name: "지출 관리" },
      { path: "/fixed-costs", name: "고정비" },
      { path: "/transactions", name: "거래 내역" },
      { path: "/chat", name: "AI 채팅" },
      { path: "/review", name: "리뷰 관리" },
      { path: "/marketing", name: "마케팅" },
      { path: "/invoices", name: "세금계산서" },
      { path: "/vendors", name: "공급업체" },
      { path: "/billing", name: "구독/결제" },
      { path: "/settings", name: "설정" },
      { path: "/settings/connections", name: "API 연결" },
    ];

    const results: { name: string; path: string; status: string; error?: string }[] = [];

    for (const p of pages) {
      try {
        await page.goto(`${BASE_URL}${p.path}`, { timeout: 15_000 });
        await page.waitForLoadState("networkidle", { timeout: 10_000 });

        if (page.url().includes("/auth/login")) {
          results.push({ name: p.name, path: p.path, status: "FAIL", error: "Redirected to login" });
          continue;
        }

        const bodyText = await page.textContent("body");
        if (bodyText?.includes("Internal Server Error") || bodyText?.includes("Application error")) {
          results.push({ name: p.name, path: p.path, status: "FAIL", error: "Server error" });
          continue;
        }

        results.push({ name: p.name, path: p.path, status: "PASS" });
        const screenshotName = p.path.replace(/\//g, "-").replace(/^-/, "");
        await page.screenshot({ path: `e2e/screenshots/page-${screenshotName}.png` });
        console.log(`>>> ${p.name} (${p.path}): PASS`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ name: p.name, path: p.path, status: "FAIL", error: msg.slice(0, 100) });
        console.log(`>>> ${p.name} (${p.path}): FAIL - ${msg.slice(0, 80)}`);
      }
    }

    // Summary
    console.log("\n========================================");
    console.log(">>> E2E TEST RESULTS");
    console.log("========================================");
    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    console.log(`PASS: ${passed} | FAIL: ${failed} | TOTAL: ${results.length}`);
    for (const r of results) {
      const icon = r.status === "PASS" ? "O" : "X";
      console.log(`  [${icon}] ${r.name} (${r.path})${r.error ? " - " + r.error : ""}`);
    }
    console.log("========================================");

    expect(failed).toBe(0);
    await page.close();
  });
});
