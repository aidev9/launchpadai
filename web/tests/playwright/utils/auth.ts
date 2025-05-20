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

/**
 * Mock authentication by bypassing the normal login flow
 * This uses localStorage to simulate an authenticated session
 * @param page Playwright page object
 */
export async function mockAuth(page: Page): Promise<void> {
  await page.goto("/");

  // Mock authentication by setting fake user data in localStorage
  await page.evaluate(() => {
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: "",
      isAuthenticated: true,
    };

    // Store the mock user data
    localStorage.setItem("user", JSON.stringify(mockUser));

    // Store a mock session token
    localStorage.setItem("sessionToken", "mock-session-token");
  });

  // Navigate to dashboard which requires auth
  await page.goto("/dashboard");
}

/**
 * Sign out from the application
 * @param page Playwright page object
 */
export async function signOut(page: Page): Promise<void> {
  // Clean up by removing authentication data
  await page.evaluate(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("sessionToken");
  });

  // Navigate to home page
  await page.goto("/");
}
