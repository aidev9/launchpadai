import { test, expect } from "@playwright/test";

test.describe("Feature Management", () => {
  // Before each test, navigate to the login page and log in
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto("/login");

    // Fill in login credentials and submit
    await page.fill(
      'input[name="email"]',
      process.env.TEST_USER_EMAIL || "test@example.com"
    );
    await page.fill(
      'input[name="password"]',
      process.env.TEST_USER_PASSWORD || "password"
    );
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL("**/dashboard");
  });

  test("should create a new feature", async ({ page }) => {
    // Navigate to the products page
    await page.goto("/myproducts");

    // Click on the first product in the list
    await page.click(".product-card:first-child");

    // Click on the Features button
    await page.click('button:has-text("Features")');

    // Click on the Add Feature button
    await page.click('button:has-text("Add Feature")');

    // Fill in feature details
    await page.fill("input#feature-name", "Test Feature");
    await page.fill(
      "textarea#feature-description",
      "This is a test feature created by Playwright"
    );
    await page.click('button:has-text("Next")');

    // Review and submit
    await page.click('button:has-text("Create Feature")');

    // Verify success message
    await expect(page.locator('div[role="status"]')).toContainText(
      "Feature created successfully"
    );

    // Verify the feature appears in the list
    await expect(page.locator("table")).toContainText("Test Feature");
  });

  test("should edit an existing feature", async ({ page }) => {
    // Navigate to the products page
    await page.goto("/myproducts");

    // Click on the first product in the list
    await page.click(".product-card:first-child");

    // Click on the Features button
    await page.click('button:has-text("Features")');

    // Click on the edit button for the first feature
    await page.click('table tr:first-child button:has-text("Edit")');

    // Update feature details
    await page.fill("input#feature-name", "Updated Feature");
    await page.fill(
      "textarea#feature-description",
      "This feature has been updated"
    );
    await page.click('button:has-text("Next")');

    // Review and submit
    await page.click('button:has-text("Update Feature")');

    // Verify success message
    await expect(page.locator('div[role="status"]')).toContainText(
      "Feature updated successfully"
    );

    // Verify the feature has been updated in the list
    await expect(page.locator("table")).toContainText("Updated Feature");
  });

  test("should delete a feature", async ({ page }) => {
    // Navigate to the products page
    await page.goto("/myproducts");

    // Click on the first product in the list
    await page.click(".product-card:first-child");

    // Click on the Features button
    await page.click('button:has-text("Features")');

    // Get the name of the first feature for verification
    const featureName = await page.textContent(
      "table tr:first-child td:nth-child(2)"
    );

    // Click on the delete button for the first feature
    await page.click('table tr:first-child button:has-text("Delete")');

    // Confirm deletion in the dialog
    await page.click('button:has-text("Delete")');

    // Verify success message
    await expect(page.locator('div[role="status"]')).toContainText(
      "Feature deleted successfully"
    );

    // Verify the feature no longer appears in the list
    await expect(page.locator("table")).not.toContainText(featureName || "");
  });

  test("should view feature details and download PRD", async ({ page }) => {
    // Navigate to the products page
    await page.goto("/myproducts");

    // Click on the first product in the list
    await page.click(".product-card:first-child");

    // Click on the Features button
    await page.click('button:has-text("Features")');

    // Click on the view button for the first feature
    await page.click('table tr:first-child button:has-text("View")');

    // Verify we're on the feature detail page
    await expect(page).toHaveURL(/.*\/myproducts\/product\/features\/detail.*/);

    // Verify the feature details are displayed
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('div:has-text("Feature Details")')).toBeVisible();

    // Click on the Download PRD button
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Download PRD")');
    const download = await downloadPromise;

    // Verify the download started
    expect(download.suggestedFilename()).toMatch(/.*-prd\.md$/);
  });
});
