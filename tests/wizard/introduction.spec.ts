import { test, expect } from '@playwright/test';

// Mock Firebase authentication
test.beforeEach(async ({ page }) => {
  // Mock Firebase Auth
  await page.addInitScript(() => {
    window.localStorage.setItem('mockFirebaseAuth', JSON.stringify({
      uid: 'test-user-' + Date.now(),
      email: 'test@example.com',
      displayName: 'Test User',
    }));
    
    // Mock Jotai atoms for testing
    window.__JOTAI_TEST_ATOMS = {
      userAtom: {
        uid: 'test-user-' + Date.now(),
        email: 'test@example.com',
        displayName: 'Test User',
      },
      wizardProgressAtom: {
        completedMiniWizards: [],
        currentMiniWizardId: null,
        mainWizardStep: 'INTRODUCTION',
      },
    };
  });
});

test('introduction wizard displays all steps correctly', async ({ page }) => {
  // Navigate to the wizard page
  await page.goto('/wizard');
  
  // Verify the introduction component is visible
  const introComponent = await page.getByTestId('wizard-introduction');
  await expect(introComponent).toBeVisible();
  
  // Step 1: Welcome
  const stepTitle = await page.getByTestId('intro-step-title');
  await expect(stepTitle).toHaveText('Welcome to the AI Journey!');
  
  const stepDescription = await page.getByTestId('intro-step-description');
  await expect(stepDescription).toHaveText('Our wizard will guide you through creating AI-powered artifacts with a simple two-step approach.');
  
  // Click next
  await page.getByTestId('intro-next-button').click();
  await page.waitForTimeout(300);
  
  // Step 2: Product Creation
  await expect(stepTitle).toHaveText('Step 1: Product Creation');
  await expect(stepDescription).toHaveText("First, you'll create a rich product context by defining business and technical details, features, and rules.");
  
  // Click next
  await page.getByTestId('intro-next-button').click();
  await page.waitForTimeout(300);
  
  // Step 3: Artifact Generation
  await expect(stepTitle).toHaveText('Step 2: Artifact Generation');
  await expect(stepDescription).toHaveText("Then, you'll create prompts and assets that are contextualized to your product or feature.");
  
  // Click next
  await page.getByTestId('intro-next-button').click();
  await page.waitForTimeout(300);
  
  // Step 4: Benefits
  await expect(stepTitle).toHaveText('Benefits');
  await expect(stepDescription).toHaveText('This approach leads to higher quality AI-generated artifacts and saves time through better-crafted prompts.');
  
  // Verify the Get Started button is shown on the last step
  const nextButton = await page.getByTestId('intro-next-button');
  await expect(nextButton).toContainText('Get Started');
  
  // Click Get Started
  await nextButton.click();
  
  // Verify we've moved past the introduction
  await expect(introComponent).not.toBeVisible({ timeout: 2000 });
});
