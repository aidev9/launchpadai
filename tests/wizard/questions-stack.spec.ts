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
        description: 'A test product for 360 questions wizard testing',
        industry: 'Technology',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'test-user-id',
        businessStack: {
          targetAudience: 'Small businesses',
          valueProposition: 'Saves time and increases productivity'
        },
        technicalStack: {
          frontend: 'React',
          backend: 'Node.js',
          database: 'Firebase',
          authentication: 'Firebase Auth',
          hosting: 'Firebase Hosting'
        }
      },
      wizardProgressAtom: {
        completedMiniWizards: [
          'CREATE_PRODUCT', 
          'CREATE_BUSINESS_STACK', 
          'CREATE_TECHNICAL_STACK'
        ],
        currentMiniWizardId: 'CREATE_360_QUESTIONS_STACK',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('360 questions wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the 360 questions form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the 360 questions form with valid data
  await page.getByTestId('questions-input').fill(`
    1. Who are the primary users of the product?
    2. What are the main pain points this product solves?
    3. What are the key features that differentiate this product?
    4. How will users interact with the product?
    5. What is the expected user journey?
    6. What metrics will define success for this product?
    7. What are the potential technical challenges?
    8. What security considerations need to be addressed?
    9. How will the product scale with increased usage?
    10. What are the regulatory or compliance requirements?
  `);
  
  // Submit the form
  await page.getByTestId('questions-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Questions Created!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
});

test('360 questions wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the 360 questions form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('questions-submit-button').click();
  
  // Check for validation errors
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill with minimal content
  await page.getByTestId('questions-input').fill('What is the target audience?');
  
  // Submit the form
  await page.getByTestId('questions-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
