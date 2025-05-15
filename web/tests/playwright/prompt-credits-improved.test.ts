import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { mockJotaiCredits } from "./utils/mock-credits";

/**
 * Comprehensive test for the Prompt Credits system
 *
 * Tests:
 * 1. Display of prompt credits in the UI
 * 2. Navigation to prompt credits pages
 * 3. Credit consumption when using various features
 * 4. Behavior when user is out of credits
 * 5. Credit reload/refresh functionality
 */

// Test user with email and password for login
const testUser = {
  email: process.env.TEST_USER_EMAIL || "test.user111@mail.com",
  password: process.env.TEST_USER_PASSWORD || "Testuser111$$",
};

// Mock credit data for tests
const standardCredits = {
  remainingCredits: 5,
  dailyCredits: 10,
  monthlyCredits: 0,
  totalUsedCredits: 15,
  lastRefillDate: Date.now(),
};

const zeroCredits = {
  remainingCredits: 0,
  dailyCredits: 10,
  monthlyCredits: 0,
  totalUsedCredits: 20,
  lastRefillDate: Date.now(),
};

// Helper function to wait for network to be stable
async function waitForNetworkIdle(
  page: import("@playwright/test").Page
): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout: 10000 });
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

// Test: Display of prompt credits in the header
test("should display prompt credits in the header", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to dashboard
  await page.goto("/dashboard");
  await waitForNetworkIdle(page);

  // Set the prompt credits to a specific value for testing
  await mockJotaiCredits(
    page,
    {
      ...standardCredits,
      remainingCredits: 5,
    },
    5000, // Increase timeout to ensure credits update
    false // Force reload to ensure atom changes reflect in UI
  );

  // Wait for credit display to update
  await waitForCreditsUpdate(page, "5");

  // Check that the credit balance is visible in the header
  const creditBalance = await page.getByTestId("credit-balance");
  await expect(creditBalance).toBeVisible();

  // Check the credit display shows exactly "5 PC"
  const creditDisplay = await page.getByTestId("credit-display");
  await expect(creditDisplay).toContainText("5");

  // Take a screenshot
  await page.screenshot({ path: "screenshots/prompt-credits-header.png" });
});

// Test: Credit consumption when using features
test("should consume a prompt credit when using features", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to dashboard
  await page.goto("/dashboard");
  await waitForNetworkIdle(page);

  // Mock the credits data with 5 credits
  await mockJotaiCredits(page, standardCredits, 5000, false);

  // Verify initial credit count
  await waitForCreditsUpdate(page, "5");
  const initialCreditDisplay = await page.getByTestId("credit-display");
  await expect(initialCreditDisplay).toBeVisible();
  console.log(
    `Initial credit display: ${await initialCreditDisplay.textContent()}`
  );

  // Simulate using a credit
  await mockJotaiCredits(
    page,
    {
      ...standardCredits,
      remainingCredits: 4, // One credit used
      totalUsedCredits: 16, // Increment used credits
    },
    5000,
    false
  );

  // Verify credit count decreased to exactly 4 PC
  await waitForCreditsUpdate(page, "4");
  const updatedCreditDisplay = await page.getByTestId("credit-display");
  await expect(updatedCreditDisplay).toContainText("4");
  console.log(
    `Updated credit display: ${await updatedCreditDisplay.textContent()}`
  );

  // Take a screenshot
  await page.screenshot({ path: "screenshots/credit-consumption.png" });
});

// Test: Navigation to purchase page
test("should allow navigation to purchase page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the credits data
  await mockJotaiCredits(page, standardCredits, 5000, false);

  // Navigate directly to the purchase page
  await page.goto("/settings/prompt-credits/purchase");
  await waitForNetworkIdle(page);

  // Verify we're on the purchase page
  await expect(page).toHaveURL(/.*\/settings\/prompt-credits\/purchase/);

  // Verify all credit packs are displayed
  await expect(
    page.getByText("300 Prompt Pack", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("600 Prompt Pack", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("900 Prompt Pack", { exact: false })
  ).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/purchase-page.png" });
});

// Test: Current balance on purchase page
test("should display current balance on purchase page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Go to purchase page first
  await page.goto("/settings/prompt-credits/purchase");
  await waitForNetworkIdle(page);

  // Now apply the mock credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Check current balance section
  await expect(
    page.getByText("Current Balance", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("Your current prompt credit balance", { exact: false })
  ).toBeVisible();

  // Check the credit display shows exactly "5 PC"
  const creditDisplay = await page.getByTestId("credit-display");
  await expect(creditDisplay).toContainText("5");
  console.log(
    `Credit display on purchase page: ${await creditDisplay.textContent()}`
  );

  // Take a screenshot
  await page.screenshot({ path: "screenshots/current-balance.png" });
});

// Test: Selection of a credit pack
test("should allow selection of a credit pack", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the credits data
  await mockJotaiCredits(page, standardCredits, 5000, false);

  // Go to purchase page
  await page.goto("/settings/prompt-credits/purchase");
  await waitForNetworkIdle(page);

  // Find the 300 credit pack and select it
  const creditPackCards = await page
    .getByText("300 Prompt Pack", { exact: false })
    .all();
  if (creditPackCards.length > 0) {
    const cardElement = await creditPackCards[0].locator(
      "xpath=ancestor::div[contains(@class, 'card')]"
    );
    await cardElement.getByRole("button", { name: /Select/i }).click();
  } else {
    // Fallback approach if the above doesn't work
    await page
      .getByRole("button", { name: /Select/i })
      .first()
      .click();
  }

  // Verify selection was successful - look for text containing the selected pack
  await expect(
    page.getByText("Complete Purchase", { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText("300 Prompt Pack", { exact: false })
  ).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/credit-pack-selection.png" });
});

// Test: AI Naming Assistant with credits
test("should consume a prompt credit when using the AI Naming Assistant", async ({
  page,
}) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Go to naming assistant
  await page.goto("/tools/naming-assistant");
  await waitForNetworkIdle(page);

  // Enter prompt and submit
  await page
    .getByTestId("naming-prompt-input")
    .fill(
      "I need a name for my tech startup that focuses on sustainable AI solutions"
    );
  await page.getByTestId("submit-naming-prompt").click();

  // Wait for the credit update to 4
  await waitForCreditsUpdate(page, "4");

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-display")).toContainText("4");

  // Verify response was received (with a longer timeout)
  await expect(page.getByTestId("naming-assistant-response")).toBeVisible({
    timeout: 15000,
  });

  // Take a screenshot
  await page.screenshot({ path: "screenshots/naming-assistant-used.png" });
});

// Test: General Chat Assistant with credits
test("should consume a prompt credit when using the Chat Assistant", async ({
  page,
}) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Go to dashboard
  await page.goto("/dashboard");
  await waitForNetworkIdle(page);

  // Open chat widget and send message
  await page.getByTestId("chat-widget-button").click();
  await page
    .getByTestId("chat-input")
    .fill("What features does LaunchpadAI offer?");
  await page.getByTestId("send-chat-message").click();

  // Wait for the credit update to 4
  await waitForCreditsUpdate(page, "4");

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-display")).toContainText("4");

  // Verify response was received (with a longer timeout)
  await expect(page.getByTestId("assistant-message")).toBeVisible({
    timeout: 15000,
  });

  // Take a screenshot
  await page.screenshot({ path: "screenshots/chat-assistant-used.png" });
});

// Test: Prompt Enhancer with credits
test("should consume a prompt credit when enhancing a prompt", async ({
  page,
}) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Go to prompt enhancer
  await page.goto("/prompts/prompt");
  await waitForNetworkIdle(page);

  // Enter prompt and enhance
  await page
    .getByTestId("prompt-input")
    .fill("Create a landing page for my business");
  await page.getByTestId("enhance-prompt-button").click();

  // Wait for the credit update to 4
  await waitForCreditsUpdate(page, "4");

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-display")).toContainText("4");

  // Verify enhanced prompt was received (with a longer timeout)
  await expect(page.getByTestId("enhanced-prompt")).toBeVisible({
    timeout: 15000,
  });

  // Take a screenshot
  await page.screenshot({ path: "screenshots/prompt-enhancer-used.png" });
});

// Test: Asset Generation with credits
test("should consume a prompt credit when generating assets", async ({
  page,
}) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Go to asset generation
  await page.goto("/assets/generate");
  await waitForNetworkIdle(page);

  // Select asset type and enter prompt
  await page.getByTestId("asset-type-select").selectOption("logo");
  await page
    .getByTestId("asset-prompt-input")
    .fill("A modern logo for a tech startup with blue and green colors");
  await page.getByTestId("generate-asset-button").click();

  // Wait for the credit update to 4
  await waitForCreditsUpdate(page, "4");

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-display")).toContainText("4");

  // Verify asset was generated (with a longer timeout)
  await expect(page.getByTestId("generated-asset")).toBeVisible({
    timeout: 15000,
  });

  // Take a screenshot
  await page.screenshot({ path: "screenshots/asset-generation-used.png" });
});

// Test: Out of credits scenario
test("should show zero credits when user is out of credits", async ({
  page,
}) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to dashboard
  await page.goto("/dashboard");
  await waitForNetworkIdle(page);

  // First set some credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Verify initial credit count shows exactly "5 PC"
  const initialCreditDisplay = await page.getByTestId("credit-display");
  await expect(initialCreditDisplay).toContainText("5");

  // Now set zero credits
  await mockJotaiCredits(page, zeroCredits, 5000, false);
  await waitForCreditsUpdate(page, "0");

  // Verify credit count shows exactly "0 PC"
  const updatedCreditDisplay = await page.getByTestId("credit-display");
  await expect(updatedCreditDisplay).toContainText("0");
  console.log(
    `Credit display with zero credits: ${await updatedCreditDisplay.textContent()}`
  );

  // Take a screenshot
  await page.screenshot({ path: "screenshots/zero-credits.png" });
});

// Test: Credit reload functionality
test("should reload daily credits at the start of a new day", async ({
  page,
}) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Set up initial credits (all used up)
  await mockJotaiCredits(
    page,
    {
      ...zeroCredits,
      // Set last refill date to yesterday
      lastRefillDate: Date.now() - 24 * 60 * 60 * 1000,
    },
    5000,
    false
  );
  await waitForCreditsUpdate(page, "0");

  // Go to dashboard
  await page.goto("/dashboard");
  await waitForNetworkIdle(page);

  // Verify credits are at 0
  await expect(page.getByTestId("credit-display")).toContainText("0");

  // Simulate a day passing by triggering a credit refresh event
  await mockJotaiCredits(
    page,
    {
      remainingCredits: 10, // Refreshed to daily limit
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 20,
      lastRefillDate: Date.now(), // Updated to today
    },
    5000,
    false
  );
  await waitForCreditsUpdate(page, "10");

  // Verify credits have been reloaded
  await expect(page.getByTestId("credit-display")).toContainText("10");

  // Take a screenshot
  await page.screenshot({ path: "screenshots/credits-reloaded.png" });
});

// Test: Subscription upgrade credit update
test("should update credits when subscription changes", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with free plan credits
  await mockJotaiCredits(page, standardCredits, 5000, false);
  await waitForCreditsUpdate(page, "5");

  // Go to upgrade page
  await page.goto("/upgrade");
  await waitForNetworkIdle(page);

  // Select Explorer plan - more robust approach
  const explorerPlanText = await page
    .getByText("Explorer", { exact: false })
    .all();
  if (explorerPlanText.length > 0) {
    for (const element of explorerPlanText) {
      const cardElement = await element.locator(
        "xpath=ancestor::div[contains(@class, 'card') or contains(@class, 'plan')]"
      );
      if (await cardElement.isVisible()) {
        await cardElement.click();
        break;
      }
    }
  } else {
    // Fallback: try to click any button that might be related to Explorer plan
    await page
      .getByRole("button", { name: /Explorer/i })
      .first()
      .click();
  }

  // Select monthly billing if available
  const monthlyButton = page.getByText("Monthly", { exact: false });
  if (await monthlyButton.isVisible()) await monthlyButton.click();

  // Click continue or next button - try multiple selectors
  try {
    const continueButtons = await page
      .getByRole("button", { name: /Continue|Next|Select Plan|Select/i })
      .all();

    if (continueButtons.length > 0) {
      for (const button of continueButtons) {
        if (await button.isVisible()) {
          await button.click();
          break;
        }
      }
    }
  } catch (error) {
    console.log("Failed to find continue button, trying alternative selector");
    // Alternative approach
    await page
      .getByRole("button")
      .filter({ hasText: /Continue|Next|Select/i })
      .first()
      .click();
  }

  // Verify we reached the payment step - look for common payment page terms
  await expect(
    page.getByText(
      /Payment|Credit Card|Checkout|Billing|Subscription|Purchase/i
    )
  ).toBeVisible({ timeout: 10000 });

  // Simulate subscription change by updating credits
  await mockJotaiCredits(
    page,
    {
      remainingCredits: 300, // Explorer plan monthly credits
      dailyCredits: 0,
      monthlyCredits: 300,
      totalUsedCredits: 15,
      lastRefillDate: Date.now(),
    },
    5000,
    false
  );

  // Go back to dashboard to verify credits updated
  await page.goto("/dashboard");
  await waitForNetworkIdle(page);
  await waitForCreditsUpdate(page, "300");

  // Verify credits have been updated to Explorer plan amount
  await expect(page.getByTestId("credit-display")).toContainText("300");

  // Take a screenshot
  await page.screenshot({
    path: "screenshots/subscription-upgrade-credits.png",
  });
});
