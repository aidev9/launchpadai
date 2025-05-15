import { Page } from "@playwright/test";

/**
 * Login to the application using test credentials
 * @param page Playwright page object
 */
export async function login(page: Page): Promise<void> {
  // Navigate to login page
  await page.goto("/auth/signin");

  // Fill in test credentials
  await page.fill(
    '[data-testid="email-input"]',
    process.env.TEST_USER_EMAIL || "test.user111@mail.com"
  );
  await page.fill(
    '[data-testid="password-input"]',
    process.env.TEST_USER_PASSWORD || "Testuser111$$"
  );

  // Submit the form
  await page.click('[data-testid="signin-button"]');

  // Wait for navigation to complete
  await page.waitForURL("/welcome");
}
