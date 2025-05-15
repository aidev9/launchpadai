import { Page } from "@playwright/test";
import { PromptCreditsData } from "./firebase";

/**
 * Enhanced function to mock prompt credits in the application
 * This directly updates the Jotai atom store used by the application
 *
 * @param page Playwright page object
 * @param creditsData Prompt credits data to mock
 */
/**
 * Enhanced function to mock prompt credits in the application
 * This directly updates the localStorage used by Jotai's atomWithStorage
 * and waits for animations to complete
 *
 * @param page Playwright page object
 * @param creditsData Prompt credits data to mock
 * @param waitTime Optional time to wait after setting credits (default: 3000ms)
 */
export async function mockJotaiCredits(
  page: Page,
  creditsData: PromptCreditsData,
  waitTime: number = 1000,
  skipReload: boolean = false
): Promise<void> {
  // Set the new data directly
  await page.evaluate((data) => {
    // Set the window.mockCredits for compatibility with existing code
    window.mockCredits = data;

    // Directly update the localStorage value used by Jotai's atomWithStorage
    try {
      // The key 'promptCredits' is from the atomWithStorage definition
      localStorage.setItem("promptCredits", JSON.stringify(data));
      console.log("Set localStorage promptCredits with:", data);

      // Force a storage event to notify listeners
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "promptCredits",
          newValue: JSON.stringify(data),
          storageArea: localStorage,
        })
      );

      // Also dispatch the custom event for any components listening for it
      window.dispatchEvent(
        new CustomEvent("mockCreditsUpdated", { detail: data })
      );
    } catch (error) {
      console.error("Failed to update localStorage:", error);
    }
  }, creditsData as any);

  // Wait for UI to update
  console.log(`Waiting ${waitTime}ms for UI to update...`);
  await page.waitForTimeout(waitTime);

  // Optionally reload the page
  if (!skipReload) {
    await page.reload();
    // Use a shorter timeout for network idle
    try {
      await page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch (error) {
      console.log("Network idle timeout - continuing anyway");
    }
  }
}

// Add this to the window interface
declare global {
  interface Window {
    mockCredits: PromptCreditsData;
    __JOTAI_SET_ATOM__?: (atomName: string, value: any) => void;
  }
}
