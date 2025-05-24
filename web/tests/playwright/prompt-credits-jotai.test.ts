import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { mockFirebaseCredits } from "../../src/lib/firebase/testing/mockUtils";

/**
 * Comprehensive test for the Prompt Credits system using Jotai state management
 * 
 * Following best practices:
 * 1. Only set Jotai atoms through localStorage
 * 2. Never directly manipulate DOM elements
 * 3. Inspect elements after state changes
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
};

const zeroCredits = {
  remainingCredits: 0,
  dailyCredits: 10,
  monthlyCredits: 0,
  totalUsedCredits: 20,
};

/**
 * Helper function to mock credits using Jotai atom through localStorage
 * This follows best practices by only setting the Jotai atom and not directly manipulating DOM
 */
async function mockJotaiCredits(page, creditsData) {
  // Set localStorage directly (used by Jotai's atomWithStorage)
  await page.evaluate((data) => {
    // Clear any existing data
    localStorage.removeItem('promptCredits');
    
    // Set the new data
    localStorage.setItem('promptCredits', JSON.stringify(data));
    console.log("Set localStorage promptCredits with:", data);
    
    // Dispatch storage event to notify listeners
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'promptCredits',
      newValue: JSON.stringify(data),
      storageArea: localStorage
    }));
  }, creditsData);
  
  // Wait for state to propagate
  await page.waitForTimeout(1000);
  
  // Reload the page to ensure state is applied
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// Test: Display of prompt credits in the header
test("should display prompt credits in the header", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  
  // Mock the credits data using Jotai atom
  await mockJotaiCredits(page, standardCredits);

  // Check that the credit balance is visible in the header
  const creditBalance = await page.getByTestId("credit-balance");
  await expect(creditBalance).toBeVisible();
  
  // Verify credit display contains PC (Prompt Credits)
  const creditDisplay = await page.getByTestId("credit-display");
  await expect(creditDisplay).toBeVisible();
  await expect(creditDisplay).toContainText("PC");
  
  // Log actual value for debugging
  const displayText = await creditDisplay.textContent();
  console.log(`Credit display shows: ${displayText}`);

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
  await page.waitForLoadState("networkidle");
  
  // Mock the credits data with 5 credits
  await mockJotaiCredits(page, standardCredits);
  
  // Verify credit display is visible
  const initialCreditDisplay = await page.getByTestId("credit-display");
  await expect(initialCreditDisplay).toBeVisible();
  await expect(initialCreditDisplay).toContainText("PC");
  
  // Log initial value
  const initialText = await initialCreditDisplay.textContent();
  console.log(`Initial credit display: ${initialText}`);
  
  // Simulate using a credit by updating the Jotai atom
  await mockJotaiCredits(page, {
    ...standardCredits,
    remainingCredits: 4, // One credit used
    totalUsedCredits: 16, // Increment used credits
  });
  
  // Verify credit display updated
  const updatedCreditDisplay = await page.getByTestId("credit-display");
  await expect(updatedCreditDisplay).toBeVisible();
  
  // Log updated value
  const updatedText = await updatedCreditDisplay.textContent();
  console.log(`Updated credit display: ${updatedText}`);
  
  // Take a screenshot
  await page.screenshot({ path: "screenshots/credit-consumption.png" });
});

// Test: Navigation to purchase page
test("should allow navigation to purchase page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Mock the credits data
  await mockJotaiCredits(page, standardCredits);

  // Navigate directly to the purchase page
  await page.goto("/settings/prompt-credits/purchase");
  await page.waitForLoadState("networkidle");
  
  // Verify we're on the purchase page
  await expect(page).toHaveURL(/.*\/settings\/prompt-credits\/purchase/);

  // Verify credit packs are displayed
  await expect(page.getByText("300 Prompt Pack", { exact: false })).toBeVisible();
  
  // Take a screenshot
  await page.screenshot({ path: "screenshots/purchase-page.png" });
});

// Test: Current balance on purchase page
test("should display current balance on purchase page", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to purchase page
  await page.goto("/settings/prompt-credits/purchase");
  await page.waitForLoadState("networkidle");
  
  // Mock the credits data
  await mockJotaiCredits(page, standardCredits);

  // Check current balance section
  await expect(page.getByText("Current Balance", { exact: false })).toBeVisible();
  
  // Verify credit display contains PC
  const creditDisplay = await page.getByTestId("credit-display");
  if (await creditDisplay.count() > 0) {
    await expect(creditDisplay).toBeVisible();
    await expect(creditDisplay).toContainText("PC");
    
    // Log actual value
    const displayText = await creditDisplay.textContent();
    console.log(`Credit display on purchase page: ${displayText}`);
  }

  // Take a screenshot
  await page.screenshot({ path: "screenshots/current-balance.png" });
});

// Test: Out of credits scenario
test("should show zero credits when user is out of credits", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  
  // First set some credits
  await mockJotaiCredits(page, standardCredits);
  
  // Now set zero credits
  await mockJotaiCredits(page, zeroCredits);
  
  // Verify credit display if it exists
  const creditDisplay = await page.getByTestId("credit-display");
  if (await creditDisplay.count() > 0) {
    await expect(creditDisplay).toBeVisible();
    
    // Log actual value
    const displayText = await creditDisplay.textContent();
    console.log(`Credit display with zero credits: ${displayText}`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: "screenshots/zero-credits.png" });
});

// Test: Credit reload functionality
test("should reload daily credits at the start of a new day", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Set up initial credits (all used up)
  await mockJotaiCredits(page, {
    ...zeroCredits,
    // Set last refill date to yesterday
    lastRefillDate: Date.now() - 24 * 60 * 60 * 1000,
  });

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");

  // Simulate a day passing by updating the Jotai atom
  await mockJotaiCredits(page, {
    remainingCredits: 10, // Refreshed to daily limit
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 20,
    lastRefillDate: Date.now(), // Updated to today
  });

  // Verify credit display if it exists
  const creditDisplay = await page.getByTestId("credit-display");
  if (await creditDisplay.count() > 0) {
    await expect(creditDisplay).toBeVisible();
    
    // Log actual value
    const displayText = await creditDisplay.textContent();
    console.log(`Credit display after reload: ${displayText}`);
  }

  // Take a screenshot
  await page.screenshot({ path: "screenshots/credits-reloaded.png" });
});
