import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { mockFirebaseCredits } from "../../src/lib/firebase/testing/mockUtils";
import { mockJotaiCredits } from "./utils/mock-credits";

/**
 * Debug test for prompt credits mocking
 */
test("debug mock credits implementation", async ({ page }) => {
  // Login
  await page.goto("/auth/signin");
  await login(page);

  // Navigate to dashboard
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  
  // Get the initial credit balance
  const initialCreditDisplay = await page.getByTestId("credit-display").textContent();
  console.log(`Initial credit display: ${initialCreditDisplay}`);
  
  // Mock the Firebase prompt credits data
  const mockCreditsData = {
    remainingCredits: 5,
    dailyCredits: 10,
    monthlyCredits: 0,
    totalUsedCredits: 15,
  };
  
  // Add a console log in the page to see when the event is received
  await page.evaluate(() => {
    console.log("Setting up event listener for mockCreditsUpdated");
    window.addEventListener("mockCreditsUpdated", (event) => {
      console.log("Mock credits event received:", event.detail);
    });
  });
  
  // Apply the mock using both methods
  await mockFirebaseCredits(page, mockCreditsData);
  
  // Try the new Jotai-based approach with a longer wait time
  await mockJotaiCredits(page, mockCreditsData, 5000);
  
  // Verify the mock was set correctly in window object
  const mockSet = await page.evaluate(() => {
    console.log("Current mockCredits value:", window.mockCredits);
    return window.mockCredits;
  });
  console.log("Mock credits set in window:", mockSet);
  
  // Wait a moment for the UI to update
  await page.waitForTimeout(1000);
  
  // Check the credit display after mocking
  const updatedCreditDisplay = await page.getByTestId("credit-display").textContent();
  console.log(`Updated credit display: ${updatedCreditDisplay}`);
  
  // Try to force a refresh of the credits display
  await page.evaluate(() => {
    // Dispatch the event again to ensure it's processed
    window.dispatchEvent(
      new CustomEvent("mockCreditsUpdated", { 
        detail: window.mockCredits 
      })
    );
  });
  
  // Wait again for UI update
  await page.waitForTimeout(1000);
  
  // Check the credit display after forcing refresh
  const finalCreditDisplay = await page.getByTestId("credit-display").textContent();
  console.log(`Final credit display after forced refresh: ${finalCreditDisplay}`);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: "screenshots/debug-credits.png" });
});
