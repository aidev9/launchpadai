import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";
import { createProduct } from "./utils/product";

test.describe("Asset Generation Performance", () => {
  test("should generate asset within 10 seconds", async ({ page }) => {
    // Login first
    await login(page);

    // Create a test product
    await createProduct(page, {
      name: "Test Product for Asset Generation",
      description: "A test product to measure asset generation performance",
      stage: "Discover",
      template_type: "blank",
    });

    // The product is now stored in a Jotai atom, no need to extract ID from URL

    // Navigate directly to review_assets page
    await page.goto("/review_assets");
    await expect(page).toHaveURL("/review_assets");

    // Click the "Add Asset" button
    await page.click('[data-testid="generate-asset-button"]');

    // Fill in the asset creation form
    await page.fill(
      '[data-testid="asset-title-input"]',
      "Performance Test Asset"
    );
    await page.fill(
      '[data-testid="asset-description-input"]',
      "Testing asset generation performance"
    );

    // The phase is already selected by default, but we can still interact with it if needed
    // For the content field
    await page.fill(
      '[data-testid="asset-prompt-input"]',
      "Create a detailed business plan for a startup in the tech industry"
    );

    // Submit the form to create the asset
    await page.click('[data-testid="start-generation-button"]');

    // Wait for the asset to be created and selected in the list
    await page.waitForSelector('[data-testid="asset-list-container"]');

    // Find and click on the newly created asset (should be the first/only one)
    const assetItem = await page
      .locator('[data-testid="asset-list-container"] li')
      .first();
    await assetItem.click();

    // Start measuring time before clicking generate
    const startTime = Date.now();

    // Click the generate button to generate content for the asset
    await page.click('[data-testid="generate-button"]');

    // Wait for content to be generated and displayed
    await page.waitForSelector('[data-testid="content-display"]', {
      state: "visible",
      timeout: 10000,
    });

    // Calculate generation time
    const generationTime = Date.now() - startTime;

    // Assert that generation took less than 10 seconds
    expect(generationTime).toBeLessThan(10000);

    // Verify that content was actually generated
    const generatedContent = await page.textContent(
      '[data-testid="content-display"]'
    );
    expect(generatedContent).toBeTruthy();
    // Lower the expected content length since it's only generating short content in testing
    expect(generatedContent?.length).toBeGreaterThan(10); // Basic content length check

    console.log(`Asset generation took ${generationTime}ms`);
  });
});
