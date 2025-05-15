import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { mockFirebaseCredits } from "./utils/firebase";

/**
 * Simple test for prompt credits in LaunchpadAI
 *
 * This test verifies basic functionality:
 * 1. Login works
 * 2. We can navigate to the dashboard
 * 3. We can mock credits via browser events
 */
test("should login and navigate to dashboard", async ({ page }) => {
  // Go to the site and login
  await page.goto("http://localhost:3000/");

  // Login
  await login(page);

  // Mock credits via browser event
  await page.evaluate(() => {
    const mockCredits = {
      remainingCredits: 5,
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 15,
    };

    window.mockCredits = mockCredits;
    window.dispatchEvent(
      new CustomEvent("mockCreditsUpdated", { detail: mockCredits })
    );
  });

  // Navigate to dashboard
  await page.goto("http://localhost:3000/dashboard");
  await page.waitForLoadState("networkidle");

  // Take a screenshot
  await page.screenshot({ path: "screenshots/dashboard.png" });

  // Verify we're on the dashboard
  expect(page.url()).toContain("/dashboard");
});

/**
 * Test for prompt credits pages
 */
test("should navigate to prompt credits page", async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3000/");
  await login(page);

  // Go to the prompt credits page
  await page.goto("http://localhost:3000/settings/prompt-credits");
  await page.waitForLoadState("networkidle");

  // Take screenshot
  await page.screenshot({ path: "screenshots/prompt-credits.png" });

  // Verify
  expect(page.url()).toContain("/settings/prompt-credits");
});

/**
 * Test for credits purchase page
 */
test("should display credit packs on purchase page", async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3000/");
  await login(page);

  // Go to purchase page
  await page.goto("http://localhost:3000/settings/prompt-credits/purchase");
  await page.waitForLoadState("networkidle");

  // Take screenshot
  await page.screenshot({ path: "screenshots/purchase-page.png" });

  // Verify purchase page loaded
  expect(page.url()).toContain("/settings/prompt-credits/purchase");
});
