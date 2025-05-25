import { test, expect, Page } from "@playwright/test";
import { login } from "./utils/auth";
import { mockFirebaseCredits } from "../../src/lib/firebase/testing/mockUtils";
import { getExpectedCreditsByPlan } from "../../src/lib/firebase/testing/mockUtils";

// Test user ID for testing
const TEST_USER_ID = "test_user_123";

/**
 * Helper to simulate a subscription upgrade for testing
 * @param page Playwright page object
 * @param fromPlan The starting plan
 * @param toPlan The plan to upgrade to
 */
async function simulateSubscriptionUpgrade(
  page: Page,
  fromPlan: string,
  toPlan: string
) {
  // Mock initial credits based on the "from" plan
  const fromCredits = getExpectedCreditsByPlan(fromPlan);
  await mockFirebaseCredits(page, {
    remainingCredits:
      fromPlan === "free" ? fromCredits.daily : fromCredits.monthly,
    dailyCredits: fromCredits.daily,
    monthlyCredits: fromCredits.monthly,
    totalUsedCredits: 0,
  });

  // Navigate to upgrade page
  await page.goto("/upgrade");

  // Select the plan to upgrade to
  await page.getByText(capitalizeFirstLetter(toPlan)).click();

  // Select monthly billing
  await page.getByRole("button", { name: "Monthly" }).click();

  // Proceed with the upgrade
  await page
    .getByRole("button", { name: /Continue|Next|Select Plan/i })
    .click();

  // In a real E2E test, we would complete the payment flow
  // Here we'll just mock successful upgrade by setting new credits

  // Mock updated credits based on the "to" plan
  const toCredits = getExpectedCreditsByPlan(toPlan);
  await mockFirebaseCredits(page, {
    remainingCredits: toPlan === "free" ? toCredits.daily : toCredits.monthly,
    dailyCredits: toCredits.daily,
    monthlyCredits: toCredits.monthly,
    totalUsedCredits: 0,
  });

  // Navigate to the credits page to verify
  await page.goto("/prompt-credits");
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Helper to verify credits after a plan change
 */
async function verifyCreditsAfterPlanChange(page: Page, planType: string) {
  const expectedCredits = getExpectedCreditsByPlan(planType);
  const expectedDisplayCredits =
    planType === "free" ? expectedCredits.daily : expectedCredits.monthly;

  // Check the displayed credits on the credits page
  const displayedCredits = await page
    .locator('[data-testid="current-credits"]')
    .textContent();
  expect(displayedCredits).toContain(String(expectedDisplayCredits));

  // Check plan name is displayed correctly
  await expect(
    page.getByText(`${capitalizeFirstLetter(planType)} Plan`)
  ).toBeVisible();
}

test.describe("Subscription Upgrade", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should update credits when upgrading from Free to Explorer plan", async ({
    page,
  }) => {
    // Simulate upgrade
    await simulateSubscriptionUpgrade(page, "free", "explorer");

    // Verify credits were updated correctly
    await verifyCreditsAfterPlanChange(page, "explorer");
  });

  test("should update credits when upgrading from Explorer to Builder plan", async ({
    page,
  }) => {
    // Simulate upgrade
    await simulateSubscriptionUpgrade(page, "explorer", "builder");

    // Verify credits were updated correctly
    await verifyCreditsAfterPlanChange(page, "builder");
  });

  test("should update credits when upgrading from Builder to Enterprise plan", async ({
    page,
  }) => {
    // Simulate upgrade
    await simulateSubscriptionUpgrade(page, "builder", "accelerator");

    // Verify credits were updated correctly
    await verifyCreditsAfterPlanChange(page, "accelerator");
  });

  test("should handle checkout flow for plan upgrade", async ({ page }) => {
    await page.goto("/upgrade");

    // Select Explorer plan
    await page.getByText("Explorer").click();

    // Select monthly billing
    await page.getByRole("button", { name: "Monthly" }).click();

    // Click continue
    await page
      .getByRole("button", { name: /Continue|Next|Select Plan/i })
      .click();

    // Verify we reached the payment step
    await expect(page.getByText(/Payment|Credit Card|Checkout/i)).toBeVisible();

    // Fill in mock payment details if the form is available
    // Note: In a real test environment, you might use Stripe test mode
    if (await page.locator('input[placeholder*="Card number"]').isVisible()) {
      await page
        .locator('input[placeholder*="Card number"]')
        .fill("4242424242424242");
      await page.locator('input[placeholder*="Expiry"]').fill("12/30");
      await page.locator('input[placeholder*="CVC"]').fill("123");
      await page.locator('input[placeholder*="ZIP"]').fill("12345");

      // Complete checkout - depends on your UI
      await page.getByRole("button", { name: /Complete|Confirm|Pay/i }).click();

      // Verify success page or confirmation
      await expect(page).toHaveURL(/success|confirmation|dashboard/);
    }
  });
});
