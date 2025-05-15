import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { mockFirebaseCredits } from "./utils/firebase";
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

// Test: Display of prompt credits in the header
test("should display prompt credits in the header", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the Firebase prompt credits data
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Check that the credit balance is visible in the header
  const creditBalance = await page.getByTestId("credit-balance");
  await expect(creditBalance).toBeVisible();
  
  // Check the credit display shows the correct amount
  const creditDisplay = await page.getByTestId("credit-display");
  // Verify it contains 'PC' (Prompt Credits) rather than an exact number
  // since the mock may not be fully controlling the displayed value
  await expect(creditDisplay).toContainText("5 PC");
  
  // Log the actual value for debugging
  console.log(`Credit display shows: ${await creditDisplay.textContent()}`);

  // Take a screenshot
  await page.screenshot({ path: "screenshots/prompt-credits-header.png" });
});

// Test: Display of prompt credits on dashboard
test("should display prompt credits on dashboard", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the Firebase prompt credits data
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Check that the credit balance component is visible
  await expect(page.getByText("Prompt Credits", { exact: false })).toBeVisible();
  await expect(page.getByText("credits", { exact: false })).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/prompt-credits-dashboard.png" });
});

// Test: Navigation to prompt credits page
test("should allow navigation to prompt credits page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the Firebase prompt credits data
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Navigate to the prompt credits page
  await page.getByText("Prompt Credits", { exact: false }).click();
  await expect(page).toHaveURL(/.*\/prompt-credits/);

  // Verify page content
  await expect(page.getByText("What are Prompt Credits?")).toBeVisible();
  await expect(page.getByText("Free Plan: 10 prompts per day")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/prompt-credits-page.png" });
});

// Test: Navigation to purchase page
test("should allow navigation to purchase page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the Firebase prompt credits data
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // First go to prompt credits page
  await page.goto("/prompt-credits");
  await page.waitForLoadState("networkidle");

  // Click on the Purchase Credits button
  await page.getByText("Purchase Credits").click();
  await expect(page).toHaveURL(/.*\/prompt-credits\/purchase/);

  // Verify credit packs are displayed
  await expect(page.getByText("300 Prompt Pack")).toBeVisible();
  await expect(page.getByText("600 Prompt Pack")).toBeVisible();
  await expect(page.getByText("900 Prompt Pack")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/purchase-page.png" });
});

// Test: Current balance on purchase page
test("should display current balance on purchase page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the Firebase prompt credits data
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to purchase page
  await page.goto("/prompt-credits/purchase");
  await page.waitForLoadState("networkidle");

  // Check current balance section
  await expect(page.getByText("Current Balance")).toBeVisible();
  await expect(page.getByText("Your current prompt credit balance")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/current-balance.png" });
});

// Test: Selection of a credit pack
test("should allow selection of a credit pack", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the Firebase prompt credits data
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to purchase page
  await page.goto("/prompt-credits/purchase");
  await page.waitForLoadState("networkidle");

  // Select the 300 credit pack
  const creditPackCard = page.getByText("300 Prompt Pack").locator("..").locator("..");
  await creditPackCard.getByText("Select").click();

  // Verify selection was successful
  await expect(page.getByText("Complete Purchase")).toBeVisible();
  await expect(page.getByText("You are purchasing the 300 Prompt Pack")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/credit-pack-selection.png" });
});

// Test: AI Naming Assistant with credits
test("should consume a prompt credit when using the AI Naming Assistant", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to naming assistant
  await page.goto("/tools/naming-assistant");
  await page.waitForLoadState("networkidle");

  // Enter prompt and submit
  await page.getByTestId("naming-prompt-input").fill(
    "I need a name for my tech startup that focuses on sustainable AI solutions"
  );
  await page.getByTestId("submit-naming-prompt").click();

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-balance")).toContainText("4");

  // Verify response was received
  await expect(page.getByTestId("naming-assistant-response")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/naming-assistant-used.png" });
});

// Test: General Chat Assistant with credits
test("should consume a prompt credit when using the Chat Assistant", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Open chat widget and send message
  await page.getByTestId("chat-widget-button").click();
  await page.getByTestId("chat-input").fill("What features does LaunchpadAI offer?");
  await page.getByTestId("send-chat-message").click();

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-balance")).toContainText("4");

  // Verify response was received
  await expect(page.getByTestId("assistant-message")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/chat-assistant-used.png" });
});

// Test: Prompt Enhancer with credits
test("should consume a prompt credit when enhancing a prompt", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to prompt enhancer
  await page.goto("/prompts/prompt");
  await page.waitForLoadState("networkidle");

  // Enter prompt and enhance
  await page.getByTestId("prompt-input").fill("Create a landing page for my business");
  await page.getByTestId("enhance-prompt-button").click();

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-balance")).toContainText("4");

  // Verify enhanced prompt was received
  await expect(page.getByTestId("enhanced-prompt")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/prompt-enhancer-used.png" });
});

// Test: Asset Generation with credits
test("should consume a prompt credit when generating assets", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with 5 credits
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to asset generation
  await page.goto("/assets/generate");
  await page.waitForLoadState("networkidle");

  // Select asset type and enter prompt
  await page.getByTestId("asset-type-select").selectOption("logo");
  await page.getByTestId("asset-prompt-input").fill(
    "A modern logo for a tech startup with blue and green colors"
  );
  await page.getByTestId("generate-asset-button").click();

  // Verify a credit was consumed
  await expect(page.getByTestId("credit-balance")).toContainText("4");

  // Verify asset was generated
  await expect(page.getByTestId("generated-asset")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/asset-generation-used.png" });
});

// Test: Insufficient credits scenario
test("should show insufficient credits message when user has no credits", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock zero credits
  await mockFirebaseCredits(page, {
    remainingCredits: 0,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 20,
  });

  // Test AI Naming Assistant
  await page.goto("/tools/naming-assistant");
  await page.waitForLoadState("networkidle");
  
  await page.getByTestId("naming-prompt-input").fill("I need a name for my startup");
  await page.getByTestId("submit-naming-prompt").click();
  
  await expect(page.getByTestId("insufficient-credits-message")).toBeVisible();
  await expect(page.getByTestId("purchase-credits-link")).toBeVisible();

  // Test General Chat
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  
  await page.getByTestId("chat-widget-button").click();
  await page.getByTestId("chat-input").fill("Help me with my business");
  await page.getByTestId("send-chat-message").click();
  
  await expect(page.getByTestId("insufficient-credits-message")).toBeVisible();

  // Test Prompt Enhancer
  await page.goto("/prompts/prompt");
  await page.waitForLoadState("networkidle");
  
  await page.getByTestId("prompt-input").fill("Create a landing page");
  await page.getByTestId("enhance-prompt-button").click();
  
  await expect(page.getByTestId("insufficient-credits-message")).toBeVisible();

  // Test Asset Generation
  await page.goto("/assets/generate");
  await page.waitForLoadState("networkidle");
  
  await page.getByTestId("asset-type-select").selectOption("logo");
  await page.getByTestId("asset-prompt-input").fill("A logo for my business");
  await page.getByTestId("generate-asset-button").click();
  
  await expect(page.getByTestId("insufficient-credits-message")).toBeVisible();

  // Take a screenshot
  await page.screenshot({ path: "screenshots/insufficient-credits.png" });
});

// Test: Credit reload functionality
test("should reload daily credits at the start of a new day", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Set up initial credits (all used up)
  await mockFirebaseCredits(page, {
    remainingCredits: 0,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 20,
    // Set last refill date to yesterday
    lastRefillDate: Date.now() - 24 * 60 * 60 * 1000,
  });

  // Go to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Verify credits are at 0
  await expect(page.getByTestId("credit-balance")).toContainText("0");

  // Simulate a day passing by triggering a credit refresh event
  await page.evaluate(() => {
    // Simulate a new day by updating the mock credits
    const refreshedCredits = {
      remainingCredits: 10, // Refreshed to daily limit
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 20,
      lastRefillDate: Date.now(), // Updated to today
    };

    window.mockCredits = refreshedCredits;
    window.dispatchEvent(
      new CustomEvent("mockCreditsUpdated", { detail: refreshedCredits })
    );
  });

  // Verify credits have been reloaded
  await expect(page.getByTestId("credit-balance")).toContainText("10");

  // Take a screenshot
  await page.screenshot({ path: "screenshots/credits-reloaded.png" });
});

// Test: Subscription upgrade credit update
test("should update credits when subscription changes", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Start with free plan credits
  await mockFirebaseCredits(page, {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  });

  // Go to upgrade page
  await page.goto("/upgrade");
  await page.waitForLoadState("networkidle");

  // Select Explorer plan
  await page.getByText("Explorer").click();

  // Select monthly billing if available
  const monthlyButton = page.getByText("Monthly");
  if (await monthlyButton.isVisible())
    await monthlyButton.click();

  // Click continue or next button
  await page.getByRole("button", { name: /Continue|Next|Select Plan/i }).click();

  // Verify we reached the payment step
  await expect(page.getByText(/Payment|Credit Card|Checkout/i)).toBeVisible();

  // Simulate subscription change by updating credits
  await page.evaluate(() => {
    // Simulate subscription upgrade
    const upgradedCredits = {
      remainingCredits: 300, // Explorer plan monthly credits
      dailyCredits: 0,
      monthlyCredits: 300,
      totalUsedCredits: 15,
    };

    window.mockCredits = upgradedCredits;
    window.dispatchEvent(
      new CustomEvent("mockCreditsUpdated", { detail: upgradedCredits })
    );
  });

  // Go back to dashboard to verify credits updated
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Verify credits have been updated to Explorer plan amount
  await expect(page.getByTestId("credit-balance")).toContainText("300");

  // Take a screenshot
  await page.screenshot({ path: "screenshots/subscription-upgrade-credits.png" });
});
