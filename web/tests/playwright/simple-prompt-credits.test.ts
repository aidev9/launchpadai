import { test, expect } from "@playwright/test";
import { login } from "./utils/auth";

/**
 * Minimal tests for prompt credits functionality in LaunchpadAI
 */

// Test login and dashboard navigation
test("should login and navigate to dashboard", async ({ page }) => {
  // Go to the site and login
  await page.goto("http://localhost:3000/");

  // Login
  await login(page);

  // Navigate to dashboard
  await page.goto("http://localhost:3000/dashboard");

  // Verify we're on the dashboard
  expect(page.url()).toContain("/dashboard");
});

// Test credits page navigation
test("should navigate to prompt credits page", async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3000/");
  await login(page);

  // Go to the prompt credits page
  await page.goto("http://localhost:3000/settings/prompt-credits");

  // Verify we're on the correct page
  expect(page.url()).toContain("/settings/prompt-credits");
});

// Test purchase page navigation
test("should navigate to purchase credits page", async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3000/");
  await login(page);

  // Go to purchase page
  await page.goto("http://localhost:3000/settings/prompt-credits/purchase");

  // Verify we're on the correct page
  expect(page.url()).toContain("/settings/prompt-credits/purchase");
});

// Test asset generation page navigation
test("should navigate to asset generation page", async ({ page }) => {
  // Login first
  await page.goto("http://localhost:3000/");
  await login(page);

  // Go to review assets page
  await page.goto("http://localhost:3000/review_assets");

  // Verify we're on the right page
  expect(page.url()).toContain("/review_assets");
});
