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
      productAtom: {
        id: 'test-product-id',
        name: 'Test Product',
        description: 'A test product for business stack wizard testing',
        industry: 'Technology',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'test-user-id',
      },
      wizardProgressAtom: {
        completedMiniWizards: ['CREATE_PRODUCT'],
        currentMiniWizardId: 'CREATE_BUSINESS_STACK',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('business stack wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the business stack form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the business stack form with valid data
  await page.getByTestId('business-target-audience-input').fill('Small to medium-sized technology companies looking to improve their development workflow');
  await page.getByTestId('business-value-proposition-input').fill('Reduces development time by 40% while improving code quality through AI-assisted workflows');
  await page.getByTestId('business-revenue-model-input').fill('Subscription-based pricing with tiered plans based on team size and usage');
  await page.getByTestId('business-market-size-input').fill('The global developer tools market is valued at $24 billion and growing at 12% annually');
  await page.getByTestId('business-competitors-input').fill('GitHub Copilot, Amazon CodeWhisperer, Tabnine');
  
  // Submit the form
  await page.getByTestId('business-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Business Stack Created!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
});

test('business stack wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the business stack form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('business-submit-button').click();
  
  // Check for validation errors
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill only target audience and try to submit
  await page.getByTestId('business-target-audience-input').fill('Small businesses');
  await page.getByTestId('business-submit-button').click();
  
  // Should still show validation errors for other required fields
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Now fill all required fields
  await page.getByTestId('business-value-proposition-input').fill('Saves time and increases productivity');
  await page.getByTestId('business-revenue-model-input').fill('Subscription model');
  await page.getByTestId('business-market-size-input').fill('$10 billion market');
  await page.getByTestId('business-competitors-input').fill('Competitor A, Competitor B');
  
  // Submit the form
  await page.getByTestId('business-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
