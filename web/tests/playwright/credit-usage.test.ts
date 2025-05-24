import { test, expect, Page } from "@playwright/test";
import { login } from "./utils/auth";
import { mockFirebaseCredits } from "../../src/lib/firebase/testing/mockUtils";

// Test user ID for consistent testing
const TEST_USER_ID = "test_user_123";

/**
 * Helper to verify credit consumption for an AI feature
 */
function verifyFeatureCreditConsumption(
  featureName: string,
  actions: (page: Page) => Promise<void>
) {
  test(`should consume a credit when using the ${featureName}`, async ({
    page,
  }) => {
    await login(page);

    // Start with 5 credits
    await mockFirebaseCredits(page, {
      remainingCredits: 5,
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 0,
    });

    // Get initial credit count
    const initialCredits = await page
      .locator('[data-testid="credit-balance"]')
      .textContent();
    expect(initialCredits).toContain("5");

    // Execute the feature-specific actions
    await actions(page);

    // Verify credit was consumed
    const finalCredits = await page
      .locator('[data-testid="credit-balance"]')
      .textContent();
    expect(finalCredits).toContain("4");
  });
}

test.describe("Credit Usage System", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Test AI Naming Assistant
  verifyFeatureCreditConsumption("AI Naming Assistant", async (page: Page) => {
    await page.goto("/tools/naming-assistant");
    await page
      .locator('[data-testid="naming-prompt-input"]')
      .fill(
        "I need a name for my tech startup that focuses on sustainable AI solutions"
      );
    await page.locator('[data-testid="submit-naming-prompt"]').click();
    await page.locator('[data-testid="naming-assistant-response"]').waitFor();
  });

  // Test Chat Assistant
  verifyFeatureCreditConsumption("Chat Assistant", async (page: Page) => {
    await page.goto("/dashboard");
    await page.locator('[data-testid="chat-widget-button"]').click();
    await page
      .locator('[data-testid="chat-input"]')
      .fill("What features does LaunchpadAI offer?");
    await page.locator('[data-testid="send-chat-message"]').click();
    await page.locator('[data-testid="assistant-message"]').waitFor();
  });

  // Test Prompt Enhancer
  verifyFeatureCreditConsumption("Prompt Enhancer", async (page: Page) => {
    await page.goto("/prompts/prompt");
    await page
      .locator('[data-testid="prompt-input"]')
      .fill("Create a landing page for my business");
    await page.locator('[data-testid="enhance-prompt-button"]').click();
    await page.locator('[data-testid="enhanced-prompt"]').waitFor();
  });

  // Test Asset Generation
  verifyFeatureCreditConsumption("Asset Generation", async (page: Page) => {
    await page.goto("/assets/generate");
    await page
      .locator('[data-testid="asset-type-select"]')
      .selectOption("logo");
    await page
      .locator('[data-testid="asset-prompt-input"]')
      .fill("A modern logo for a tech startup with blue and green colors");
    await page.locator('[data-testid="generate-asset-button"]').click();
    await page.locator('[data-testid="generated-asset"]').waitFor();
  });

  // Test no credits scenario
  test("should show insufficient credits message when user has no credits", async ({
    page,
  }) => {
    // Mock zero credits
    await mockFirebaseCredits(page, {
      remainingCredits: 0,
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 20,
    });

    // Test with Naming Assistant
    await page.goto("/tools/naming-assistant");
    await page
      .locator('[data-testid="naming-prompt-input"]')
      .fill("I need a name for my startup");
    await page.locator('[data-testid="submit-naming-prompt"]').click();

    // Verify insufficient credits message is shown
    await expect(
      page.locator('[data-testid="insufficient-credits-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="purchase-credits-link"]')
    ).toBeVisible();
  });
});
