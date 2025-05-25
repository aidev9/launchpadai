import { test, expect, Page } from "@playwright/test";
import { login } from "./utils/auth";
import {
  mockFirebaseCredits,
  getExpectedCreditsByPlan,
} from "../../src/lib/firebase/testing/mockUtils";

// Test user ID for testing
const TEST_USER_ID = "test_user_123";

/**
 * Helper to verify prompt credits match expected values based on plan
 * @param planType The subscription plan type
 */
function verifyPromptCredits(planType: string) {
  test(`should have correct credits for ${planType} plan`, async ({ page }) => {
    // Log in first
    await login(page);

    // Get expected credit values for this plan
    const expectedValues = getExpectedCreditsByPlan(planType);

    // Mock credits according to the plan
    const expectedRemaining =
      expectedValues.monthly > 0
        ? expectedValues.monthly
        : expectedValues.daily;

    await mockFirebaseCredits(page, {
      dailyCredits: expectedValues.daily,
      monthlyCredits: expectedValues.monthly,
      remainingCredits: expectedRemaining,
      totalUsedCredits: 0,
    });

    // Navigate to the credits page
    await page.goto("/prompt-credits");

    // Verify the credits match the expected plan

    // Check daily credits if applicable
    if (expectedValues.daily > 0) {
      const dailyCreditsElement = page.locator('[data-testid="daily-credits"]');
      await expect(dailyCreditsElement).toBeVisible();
      await expect(dailyCreditsElement).toContainText(
        String(expectedValues.daily)
      );
    }

    // Check monthly credits if applicable
    if (expectedValues.monthly > 0) {
      const monthlyCreditsElement = page.locator(
        '[data-testid="monthly-credits"]'
      );
      await expect(monthlyCreditsElement).toBeVisible();
      await expect(monthlyCreditsElement).toContainText(
        String(expectedValues.monthly)
      );
    }

    // Check remaining credits
    const remainingCreditsElement = page.locator(
      '[data-testid="current-credits"]'
    );
    await expect(remainingCreditsElement).toBeVisible();
    await expect(remainingCreditsElement).toContainText(
      String(expectedRemaining)
    );

    // Check plan type is displayed correctly
    await expect(
      page.getByText(
        `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        { exact: false }
      )
    ).toBeVisible();
  });
}

test.describe("Prompt Credits Verification", () => {
  // Test each plan type
  verifyPromptCredits("free");
  verifyPromptCredits("explorer");
  verifyPromptCredits("builder");
  verifyPromptCredits("accelerator");

  // Test credits display in various UI locations
  test("should display credits in header and dashboard", async ({ page }) => {
    // Log in first
    await login(page);

    // Mock credits
    await mockFirebaseCredits(page, {
      dailyCredits: 10,
      monthlyCredits: 0,
      remainingCredits: 8, // Some credits used
      totalUsedCredits: 2,
    });

    // Check header display
    const headerCredits = page.locator('[data-testid="credit-balance"]');
    await expect(headerCredits).toBeVisible();
    await expect(headerCredits).toContainText("8");

    // Check dashboard display
    await page.goto("/dashboard");
    const dashboardCredits = page.locator('[data-testid="dashboard-credits"]');
    if (await dashboardCredits.isVisible()) {
      await expect(dashboardCredits).toContainText("8");
    }
  });

  // Test credit usage history if available
  test("should display credit usage history", async ({ page }) => {
    // Log in first
    await login(page);

    // Navigate to credit history page if it exists
    await page.goto("/prompt-credits/history");

    // This test is conditional on whether the history page exists
    // Check if we're on the history page
    if (page.url().includes("/history")) {
      // Verify the page has expected elements
      await expect(page.getByText("Credit Usage History")).toBeVisible();

      // Check for history table
      const historyTable = page.locator('[data-testid="credit-history-table"]');
      if (await historyTable.isVisible()) {
        // Verify table columns
        await expect(page.getByText("Date")).toBeVisible();
        await expect(page.getByText("Feature")).toBeVisible();
        await expect(page.getByText("Credits Used")).toBeVisible();
      }
    } else {
      // Skip test if history page doesn't exist
      test.skip();
    }
  });
});
