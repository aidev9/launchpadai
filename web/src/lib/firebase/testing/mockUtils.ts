import { Page } from '@playwright/test';

/**
 * Interface for prompt credits data
 */
export interface PromptCreditsData {
  remainingCredits: number;
  dailyCredits: number;
  monthlyCredits: number;
  totalUsedCredits: number;
  lastRefillDate?: number;
}

/**
 * Mock Firebase prompt credits for testing
 * @param page Playwright page object
 * @param creditsData Prompt credits data to mock
 */
export async function mockFirebaseCredits(
  page: Page,
  creditsData: PromptCreditsData
): Promise<void> {
  await page.evaluate((data) => {
    // This is a mock implementation - in a real test environment,
    // you would set up proper backend mocking
    window.mockCredits = data;
    // Dispatch an event that your app can listen for to update the UI
    window.dispatchEvent(
      new CustomEvent("mockCreditsUpdated", { detail: data })
    );
  }, creditsData as any);
}

/**
 * Map of expected credits by plan
 */
export const expectedCreditsByPlan = {
  free: { daily: 10, monthly: 0 },
  explorer: { daily: 0, monthly: 300 },
  builder: { daily: 0, monthly: 600 },
  enterprise: { daily: 0, monthly: 900 },
};

/**
 * Get expected credit values by plan type
 * @param planType The subscription plan type
 * @returns Expected daily and monthly credit values
 */
export function getExpectedCreditsByPlan(planType: string) {
  const plan = planType.toLowerCase();
  return (
    expectedCreditsByPlan[plan as keyof typeof expectedCreditsByPlan] ||
    expectedCreditsByPlan.free
  );
}

/**
 * Get the price for a subscription plan
 * @param planType The subscription plan type
 * @returns The price of the plan
 */
export function getPlanPrice(planType: string): number {
  switch (planType.toLowerCase()) {
    case "free":
      return 0;
    case "explorer":
      return 29;
    case "builder":
      return 59;
    case "accelerator":
      return 99;
    default:
      return 0;
  }
}

// This is for mocking Window with mockCredits
declare global {
  interface Window {
    mockCredits: PromptCreditsData;
  }
}
