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
        description: 'A test product for features wizard testing',
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
        },
        questionsStack: {
          questions: ['Who are the primary users?']
        },
        rulesStack: {
          rules: ['Must use Firebase for backend services']
        }
      },
      wizardProgressAtom: {
        completedMiniWizards: [
          'CREATE_PRODUCT', 
          'CREATE_BUSINESS_STACK', 
          'CREATE_TECHNICAL_STACK',
          'CREATE_360_QUESTIONS_STACK',
          'CREATE_RULES_STACK'
        ],
        currentMiniWizardId: 'ADD_FEATURES',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('features wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the features form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the features form with valid data
  await page.getByTestId('features-input').fill(`
    1. User Authentication with Firebase Auth
    2. Real-time data synchronization
    3. Offline support with local caching
    4. Dark mode / light mode toggle
    5. User profile management
    6. Dashboard with key metrics
    7. Notification system
    8. Export data to CSV/PDF
    9. Admin panel for user management
    10. Analytics integration with Firebase Analytics
  `);
  
  // Submit the form
  await page.getByTestId('features-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Features Added!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
});

test('features wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the features form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('features-submit-button').click();
  
  // Check for validation errors
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill with minimal content
  await page.getByTestId('features-input').fill('User authentication with Firebase Auth');
  
  // Submit the form
  await page.getByTestId('features-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
