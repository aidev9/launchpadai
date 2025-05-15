import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { mockJotaiCredits } from "./utils/mock-credits";

/**
 * Test for the Prompt Template Enhancement flow
 *
 * This test:
 * 1. Signs in the user
 * 2. Navigates to prompt templates page
 * 3. Selects the first template
 * 4. Enhances the prompt on the template detail page
 */

const testUser = {
  email: process.env.TEST_USER_EMAIL || "test.user111@mail.com",
  password: process.env.TEST_USER_PASSWORD || "Testuser111$$",
};

// Mock credit data to ensure the user has sufficient credits
const standardCredits = {
  remainingCredits: 5,
  dailyCredits: 10,
  monthlyCredits: 0,
  totalUsedCredits: 15,
  lastRefillDate: Date.now(),
};

// Helper function to wait for network to be stable
async function waitForNetworkIdle(
  page: import("@playwright/test").Page,
  timeout = 10000
): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch (error) {
    console.log("Network idle timeout - continuing anyway");
  }
}

// Helper function to wait for credits to update
async function waitForCreditsUpdate(
  page: import("@playwright/test").Page,
  expectedValue: string,
  timeout = 10000
): Promise<void> {
  try {
    await page.waitForFunction(
      (value: string) => {
        const displayElement = document.querySelector(
          '[data-testid="credit-display"]'
        );
        return displayElement && displayElement.textContent?.includes(value);
      },
      expectedValue,
      { timeout }
    );
  } catch (error) {
    console.log(`Timeout waiting for credits to update to ${expectedValue}`);
  }
}

test("should enhance a prompt from template detail page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to prompt templates page
  await page.goto("/prompts");
  await waitForNetworkIdle(page);

  // Verify we're on the templates page
  await expect(page).toHaveURL(/.*\/prompts/);

  // Select the first template
  await page.getByTestId("template-card").first().click();

  // Wait longer for the detail page to load
  await waitForNetworkIdle(page, 20000);
  await page.waitForTimeout(2000); // Additional wait to ensure page is fully loaded

  // Check we're on the detail page by URL
  await expect(page).toHaveURL(/.*\/prompts\/prompt/);

  // Check for the main content container first using a more reliable approach
  const mainContainer = page.locator("main").locator("div").first();
  await expect(mainContainer).toBeVisible();

  // Verify the template content is visible (original content)
  await expect(page.getByTestId("original-content")).toBeVisible({
    timeout: 10000,
  });

  // Check if the enhance button is present and click it
  await expect(page.getByTestId("enhance-prompt-button")).toBeVisible();
  await page.getByTestId("enhance-prompt-button").click();

  // Wait for the enhance button to be disabled during processing
  await expect(page.getByTestId("enhance-prompt-button")).toBeDisabled();

  // Wait for network idle after enhancement
  await waitForNetworkIdle(page, 30000);

  // Wait for the credit update
  await expect(page.getByTestId("credit-display")).toBeVisible();

  // Wait for enhancement process to complete by looking for the enhanced prompt
  await expect(page.getByTestId("template-content")).toBeVisible({
    timeout: 30000,
  });

  // Verify the enhanced prompt is different from the original
  const originalPrompt = await page
    .getByTestId("original-content")
    .textContent();
  const enhancedPrompt = await page
    .getByTestId("template-content")
    .textContent();

  expect(originalPrompt).not.toEqual(enhancedPrompt);
  expect(enhancedPrompt?.length).toBeGreaterThan(0);

  // Take a screenshot of the enhanced prompt
  await page.screenshot({ path: "screenshots/template-enhanced-prompt.png" });
});
