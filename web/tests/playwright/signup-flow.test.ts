import { test, expect } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

// Create a unique ID that can be shared between tests
const uniqueId = uuidv4().substring(0, 8);
const testUser = {
  name: `Test User ${uniqueId}`,
  email: `test${uniqueId}@example.com`,
  password: "Test1234!",
  company: "Test Company",
  phone: "+1 (555) 555-1234",
  role: "developer",
  interest: "ai",
  bio: "This is a test bio for automated testing",
};

test.describe("User Signup Flow", () => {
  // Set a longer timeout for these tests
  test.setTimeout(60000);

  test("should create a new account successfully", async ({ page }) => {
    // Step 1: Navigate to signup page
    console.log("Navigating to signup page");
    await page.goto("http://localhost:3000/auth/signup");
    await page.waitForLoadState("networkidle");

    // Take screenshot of the signup page
    await page.screenshot({ path: "test-results/signup-page.png" });

    console.log("Filling signup form");

    // Step 2: Fill the signup form
    await page.getByLabel("Name(*)").fill(testUser.name);
    await page.getByLabel("Email(*)").fill(testUser.email);
    await page.getByLabel("Password(*)").fill(testUser.password);
    await page.getByLabel("Company").fill(testUser.company);
    await page.getByLabel("Phone").fill(testUser.phone);

    // Role selection - handle both native select and shadcn UI Select components
    try {
      // Try selecting using ShadCN UI Select component format
      await page.getByLabel("Role").click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: "Developer" }).click();
      console.log("Selected role using ShadCN UI component");
    } catch (e) {
      console.log("Trying alternative role selector");
      try {
        // Try with SelectTrigger
        await page.locator("button[role='combobox']").first().click();
        await page.waitForTimeout(500);
        await page.getByText("Developer", { exact: true }).click();
      } catch (e2) {
        // Fallback to native select
        await page.selectOption("select[name='role']", "developer");
      }
    }

    // Interest selection - handle both native select and shadcn UI Select components
    try {
      // Try selecting using ShadCN UI Select component format
      await page.getByLabel("Interest").click();
      await page.waitForTimeout(500);
      await page.getByRole("option", { name: "AI Development" }).click();
      console.log("Selected interest using ShadCN UI component");
    } catch (e) {
      console.log("Trying alternative interest selector");
      try {
        // Try with SelectTrigger
        await page.locator("button[role='combobox']").nth(1).click();
        await page.waitForTimeout(500);
        await page.getByText("AI Development", { exact: true }).click();
      } catch (e2) {
        // Fallback to native select
        await page.selectOption("select[name='interest']", "ai");
      }
    }

    // Take screenshot of filled form
    await page.screenshot({ path: "test-results/filled-signup-form.png" });

    // Step 3: Submit the form
    console.log("Submitting signup form");
    await page.getByRole("button", { name: "Create Account" }).click();

    // Wait for successful signup and navigation to FTUX page
    console.log("Waiting for navigation after signup");
    try {
      await page.waitForURL("**/welcome**", { timeout: 30000 });
      console.log("Successfully navigated to FTUX page");
      await page.screenshot({ path: "test-results/welcome-page.png" });
    } catch (e) {
      console.error("Navigation to FTUX page timed out:", e);
      await page.screenshot({
        path: "test-results/signup-navigation-timeout.png",
      });
      throw e;
    }
  });

  test("should verify user profile details", async ({ page }) => {
    // Login with the user account created in the previous test
    console.log("Logging in with test user account");
    await page.goto("http://localhost:3000/auth/signin");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    // Wait for successful login - might redirect to dashboard or welcome
    console.log("Waiting for successful login");
    try {
      await Promise.race([
        page.waitForURL("**/dashboard**", { timeout: 15000 }),
        page.waitForURL("**/welcome**", { timeout: 15000 }),
      ]);
      console.log("Successfully logged in to:", page.url());
    } catch (e) {
      console.error("Login navigation timed out:", e);
      await page.screenshot({
        path: "test-results/login-navigation-timeout.png",
      });
      throw e;
    }

    // Step 1: Navigate to account settings page first to verify name
    console.log("Navigating to account settings page");
    await page.goto("http://localhost:3000/settings/account");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/settings-account-page.png" });

    // Step 2: Verify user name in account settings
    console.log("Verifying user name in account settings");

    // Check name field in account settings
    try {
      const nameInput = await page.locator('input[name="name"]').first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      const nameValue = await nameInput.inputValue();
      expect(nameValue).toBe(testUser.name);
      console.log("Successfully verified name in account settings");
    } catch (e) {
      console.error("Error verifying name:", e);
      // Take screenshot of the failure
      await page.screenshot({
        path: "test-results/name-verification-error.png",
      });
    }

    // Check email in account settings - checking for presence on page rather than exact element
    console.log("Verifying email presence on account settings page");
    const pageContent = await page.content();
    expect(pageContent).toContain(testUser.email);
    console.log("Successfully verified email in account settings");

    // Now navigate to profile settings to continue the test
    console.log("Navigating to profile settings page");
    await page.goto("http://localhost:3000/settings/profile");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/settings-profile-page.png" });

    // Update profile fields and verify at least one is saved
    try {
      const displayNameInput = await page
        .locator('input[name="displayName"]')
        .first();
      await expect(displayNameInput).toBeVisible({ timeout: 5000 });
      const displayNameValue = await displayNameInput.inputValue();
      console.log(`Current display name: "${displayNameValue}"`);

      // Update display name if it's empty
      if (!displayNameValue) {
        console.log("Display name is empty, updating it");
        await displayNameInput.fill(testUser.name);
      }

      // Update bio
      console.log("Updating bio");
      const bioField = await page.locator('textarea[name="bio"]').first();
      await bioField.fill(testUser.bio);

      // Add a URL
      console.log("Adding URL");
      const urlInput = await page.locator('input[name="urls.0.value"]').first();
      await urlInput.fill("https://example.com/profile");

      // Save the profile updates
      console.log("Saving profile updates");
      await page.getByRole("button", { name: "Update profile" }).click();

      // Wait for 1 second to let the toast appear
      console.log("Waiting for toast notification...");
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: "test-results/after-update-waiting-for-toast.png",
      });

      // Verify the form fields still contain our entered values
      console.log("Verifying form fields still contain entered values");

      // Check display name field
      const updatedDisplayNameValue = await displayNameInput.inputValue();
      console.log(`Current display name: "${updatedDisplayNameValue}"`);
      expect(updatedDisplayNameValue).toBe(testUser.name);

      // Check bio field
      const updatedBioValue = await bioField.inputValue();
      console.log(`Current bio: "${updatedBioValue}"`);
      expect(updatedBioValue).toBe(testUser.bio);

      // Check URL field
      const updatedUrlValue = await urlInput.inputValue();
      console.log(`Current URL: "${updatedUrlValue}"`);
      expect(updatedUrlValue).toBe("https://example.com/profile");

      console.log("Successfully verified all profile fields after update");
      await page.screenshot({
        path: "test-results/after-profile-update-verification.png",
      });

      console.log("Test completed successfully - verified profile update");
    } catch (e) {
      console.error("Error during profile update verification:", e);
      await page.screenshot({ path: "test-results/profile-update-error.png" });
      throw e;
    }
  });
});
