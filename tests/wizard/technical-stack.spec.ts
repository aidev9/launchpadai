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
    
    // Mock Jotai atoms for testing - following user rule #14 to use Jotai atoms
    window.__JOTAI_TEST_ATOMS = {
      userAtom: {
        uid: 'test-user-' + Date.now(),
        email: 'test@example.com',
        displayName: 'Test User',
      },
      productAtom: {
        id: 'test-product-id',
        name: 'Test Product',
        description: 'A test product for technical stack wizard testing',
        industry: 'Technology',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'test-user-id',
        businessStack: {
          targetAudience: 'Small businesses',
          valueProposition: 'Saves time and increases productivity'
        }
      },
      wizardProgressAtom: {
        completedMiniWizards: ['CREATE_PRODUCT', 'CREATE_BUSINESS_STACK'],
        currentMiniWizardId: 'CREATE_TECHNICAL_STACK',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('technical stack wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the technical stack form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the technical stack form with valid data
  // Select frontend framework - using React as per user rule #5
  await page.getByTestId('tech-stack-frontend-select').click();
  await page.getByText('React').click();
  
  // Select backend framework
  await page.getByTestId('tech-stack-backend-select').click();
  await page.getByText('Node.js').click();
  
  // Select database - using Firebase as per user rule #6
  await page.getByTestId('tech-stack-database-select').click();
  await page.getByText('Firebase').click();
  
  // Select authentication - using Firebase Auth as per user rule #7
  await page.getByTestId('tech-stack-auth-select').click();
  await page.getByText('Firebase Auth').click();
  
  // Select hosting - using Firebase Hosting as per user rule #9
  await page.getByTestId('tech-stack-hosting-select').click();
  await page.getByText('Firebase Hosting').click();
  
  // Fill in additional technical details
  await page.getByTestId('tech-stack-additional-details-input').fill('Using Jotai for state management and Playwright for testing as per project standards');
  
  // Submit the form
  await page.getByTestId('tech-stack-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Technical Stack Created!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
});

test('technical stack wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the technical stack form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('tech-stack-submit-button').click();
  
  // Check for validation errors
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill only frontend and try to submit
  await page.getByTestId('tech-stack-frontend-select').click();
  await page.getByText('React').click();
  await page.getByTestId('tech-stack-submit-button').click();
  
  // Should still show validation errors for other required fields
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Now fill all required fields
  await page.getByTestId('tech-stack-backend-select').click();
  await page.getByText('Node.js').click();
  
  await page.getByTestId('tech-stack-database-select').click();
  await page.getByText('Firebase').click();
  
  await page.getByTestId('tech-stack-auth-select').click();
  await page.getByText('Firebase Auth').click();
  
  await page.getByTestId('tech-stack-hosting-select').click();
  await page.getByText('Firebase Hosting').click();
  
  // Submit the form
  await page.getByTestId('tech-stack-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
