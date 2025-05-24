import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

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
      productAtom: null,
      wizardProgressAtom: {
        completedMiniWizards: [],
        currentMiniWizardId: 'CREATE_PRODUCT',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('product creation wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the product form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the product form with valid data
  const productName = `Test Product ${uuidv4().substring(0, 8)}`;
  await page.getByTestId('product-name-input').fill(productName);
  await page.getByTestId('product-description-input').fill('This is a comprehensive test product created by Playwright automated tests. It includes various features and capabilities designed to showcase the wizard functionality.');
  
  // Select industry
  await page.getByTestId('product-industry-select').click();
  await page.getByText('Technology').click();
  
  // Submit the form
  await page.getByTestId('product-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Product Created!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Verify the XP value is a positive number
  const xpText = await xpEarned.textContent();
  const xpValue = parseInt(xpText.replace(/\D/g, ''));
  expect(xpValue).toBeGreaterThan(0);
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
});

test('product creation wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the product form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('product-submit-button').click();
  
  // Check for validation errors
  // Note: This assumes your form shows validation errors when submitted with empty fields
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill only product name and try to submit
  await page.getByTestId('product-name-input').fill('Incomplete Product');
  await page.getByTestId('product-submit-button').click();
  
  // Should still show validation errors for other required fields
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Now fill all required fields
  await page.getByTestId('product-description-input').fill('This is a test product');
  await page.getByTestId('product-industry-select').click();
  await page.getByText('Technology').click();
  
  // Submit the form
  await page.getByTestId('product-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
