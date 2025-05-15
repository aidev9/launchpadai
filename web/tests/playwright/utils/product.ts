import { Page } from "@playwright/test";

interface CreateProductParams {
  name: string;
  description: string;
  stage: string;
  template_type: string;
}

/**
 * Create a new product for testing
 * @param page Playwright page object
 * @param params Product parameters
 * @returns The ID of the created product (currently not needed as product is stored in Jotai atom)
 */
export async function createProduct(
  page: Page,
  params: CreateProductParams
): Promise<void> {
  // Skip the template selection page and go directly to the wizard with blank template
  // This is more reliable for automated tests
  await page.goto("/welcome/wizard?template=blank&type=blank");

  // Now we're on the wizard page - fill in product details
  await page.fill('[data-testid="product-name-input"]', params.name);
  await page.fill(
    '[data-testid="product-description-input"]',
    params.description
  );

  // For testing purposes, skip the dropdown interaction completely
  // The "Next" button will enable if all required fields are filled
  // The name and description fields should be enough to enable the button

  // Click Next to go to second step
  await page.locator('button:has-text("Next")').click();

  // On the problem statement page, just click Next again
  await page.locator('button:has-text("Next")').click();

  // On the final step, click the submit button
  await page.click('[data-testid="submit-product-button"]');

  // Wait for navigation to complete to product page
  await page.waitForURL(/\/product/);

  // No need to extract ID from URL, product is stored in Jotai atom
  return;
}
