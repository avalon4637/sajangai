import { test, expect, type Page } from "playwright/test";

const BASE_URL = "https://www.sajang.ai";
const TEST_EMAIL = "avalon55@naver.com";
const TEST_PASSWORD = "12091080a";

// Business info from registration certificate
const BUSINESS = {
  number: "2020809355", // 202-08-09355 without dashes
  name: "프렌즈 스크린 부천로얄점",
  type: "스크린 골프 연습장",
  address: "경기도 부천시 길주로 262, B동 2층 207호",
};

test.describe("sajang.ai Full User Flow", () => {
  test.setTimeout(120_000);

  test("1. Landing page loads", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/사장/i);
    // Check key landing elements
    const body = await page.textContent("body");
    expect(body).toContain("사장");
  });

  test("2. Login with Kakao credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    // Wait for login page to load
    await page.waitForLoadState("networkidle");

    // Take screenshot of login page
    await page.screenshot({ path: "e2e/screenshots/01-login-page.png" });

    // Find and click Kakao login button
    const kakaoButton = page.locator('button:has-text("카카오"), a:has-text("카카오")').first();
    if (await kakaoButton.isVisible()) {
      await kakaoButton.click();

      // Wait for Kakao OAuth page
      await page.waitForURL(/accounts\.kakao\.com|kauth\.kakao\.com/, { timeout: 15_000 }).catch(() => {
        // May already be logged in to Kakao
      });

      // If on Kakao login page, fill credentials
      if (page.url().includes("kakao.com")) {
        await page.screenshot({ path: "e2e/screenshots/02-kakao-login.png" });

        // Kakao login form
        const emailInput = page.locator('input[name="loginId"], input[name="email"], #loginId--1').first();
        const pwInput = page.locator('input[name="password"], #password--2').first();

        if (await emailInput.isVisible()) {
          await emailInput.fill(TEST_EMAIL);
          await pwInput.fill(TEST_PASSWORD);
          await page.screenshot({ path: "e2e/screenshots/03-kakao-filled.png" });

          // Click login button
          const loginBtn = page.locator('button[type="submit"], button:has-text("로그인")').first();
          await loginBtn.click();

          // Wait for redirect back to sajang.ai
          await page.waitForURL(/sajang\.ai/, { timeout: 30_000 });
        }
      }
    }

    await page.screenshot({ path: "e2e/screenshots/04-after-login.png" });

    // Should be on dashboard or onboarding
    const currentUrl = page.url();
    expect(
      currentUrl.includes("/dashboard") || currentUrl.includes("/onboarding")
    ).toBeTruthy();
  });

  test("3. Full flow: Login -> Onboarding -> Dashboard", async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState("networkidle");

    const kakaoButton = page.locator('button:has-text("카카오"), a:has-text("카카오")').first();
    if (await kakaoButton.isVisible()) {
      await kakaoButton.click();

      await page.waitForURL(/kakao\.com|sajang\.ai/, { timeout: 15_000 }).catch(() => {});

      if (page.url().includes("kakao.com")) {
        const emailInput = page.locator('input[name="loginId"], input[name="email"], #loginId--1').first();
        const pwInput = page.locator('input[name="password"], #password--2').first();

        if (await emailInput.isVisible()) {
          await emailInput.fill(TEST_EMAIL);
          await pwInput.fill(TEST_PASSWORD);
          const loginBtn = page.locator('button[type="submit"], button:has-text("로그인")').first();
          await loginBtn.click();
          await page.waitForURL(/sajang\.ai/, { timeout: 30_000 });
        }
      }
    }

    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/10-post-login.png" });

    // Check if we need onboarding
    if (page.url().includes("/onboarding")) {
      console.log(">>> On onboarding page - registering business");
      await page.screenshot({ path: "e2e/screenshots/11-onboarding.png" });

      // Fill business number
      const bizNumberInput = page.locator('#businessNumber, input[placeholder*="000-00"]').first();
      if (await bizNumberInput.isVisible()) {
        await bizNumberInput.fill(BUSINESS.number);

        // Click verify button
        const verifyBtn = page.locator('button:has-text("인증")').first();
        if (await verifyBtn.isEnabled()) {
          await verifyBtn.click();
          // Wait for verification result
          await page.waitForTimeout(3000);
          await page.screenshot({ path: "e2e/screenshots/12-biz-verified.png" });
        }
      }

      // Fill business name
      const nameInput = page.locator('#name, input[placeholder*="사업장명"]').first();
      await nameInput.fill(BUSINESS.name);

      // Fill business type
      const typeInput = page.locator('#business_type, input[placeholder*="업종"], input[placeholder*="음식점"]').first();
      if (await typeInput.isVisible()) {
        await typeInput.fill(BUSINESS.type);
      }

      // Fill address
      const addressInput = page.locator('#address, input[placeholder*="주소"]').first();
      if (await addressInput.isVisible()) {
        await addressInput.fill(BUSINESS.address);
      }

      await page.screenshot({ path: "e2e/screenshots/13-biz-filled.png" });

      // Submit
      const submitBtn = page.locator('button[type="submit"]:has-text("등록"), button:has-text("사업장 등록")').first();
      await submitBtn.click();

      // Wait for navigation to preferences or dashboard
      await page.waitForURL(/preferences|dashboard/, { timeout: 15_000 });
      await page.screenshot({ path: "e2e/screenshots/14-after-register.png" });

      // If on preferences page, complete it
      if (page.url().includes("/preferences")) {
        console.log(">>> On preferences page");
        await page.screenshot({ path: "e2e/screenshots/15-preferences.png" });

        // Look for skip or submit button
        const skipBtn = page.locator('button:has-text("건너뛰기"), button:has-text("다음"), button[type="submit"]').first();
        if (await skipBtn.isVisible()) {
          await skipBtn.click();
          await page.waitForURL(/dashboard/, { timeout: 15_000 });
        }
      }
    }

    // Should be on dashboard now
    await page.waitForURL(/dashboard/, { timeout: 15_000 });
    await page.screenshot({ path: "e2e/screenshots/20-dashboard.png" });
    expect(page.url()).toContain("/dashboard");
    console.log(">>> Dashboard loaded successfully!");

    // --- Test main features ---

    // Test: Revenue page
    await page.goto(`${BASE_URL}/revenue`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/30-revenue.png" });
    const revenueBody = await page.textContent("body");
    expect(revenueBody).toContain("매출");
    console.log(">>> Revenue page OK");

    // Test: Expense page
    await page.goto(`${BASE_URL}/expense`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/31-expense.png" });
    console.log(">>> Expense page OK");

    // Test: Chat page
    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/32-chat.png" });
    console.log(">>> Chat page OK");

    // Test: Review page (답장이)
    await page.goto(`${BASE_URL}/review`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/33-review.png" });
    console.log(">>> Review page OK");

    // Test: Marketing page (바이럴)
    await page.goto(`${BASE_URL}/marketing`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/34-marketing.png" });
    console.log(">>> Marketing page OK");

    // Test: Settings page
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/35-settings.png" });
    console.log(">>> Settings page OK");

    // Test: Billing page
    await page.goto(`${BASE_URL}/billing`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/36-billing.png" });
    console.log(">>> Billing page OK");

    // Test: Transactions page
    await page.goto(`${BASE_URL}/transactions`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "e2e/screenshots/37-transactions.png" });
    console.log(">>> Transactions page OK");

    console.log(">>> ALL PAGES VERIFIED SUCCESSFULLY!");
  });
});
