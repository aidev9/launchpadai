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
    
    // Mock Jotai atoms for testing - following user rule #14 to use Jotai atoms instead of URL params
    window.__JOTAI_TEST_ATOMS = {
      userAtom: {
        uid: 'test-user-' + Date.now(),
        email: 'test@example.com',
        displayName: 'Test User',
      },
      productAtom: {
        id: 'test-product-id',
        name: 'Test Product',
        description: 'A test product for rules wizard testing',
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
          questions: [
            'Who are the primary users of the product?',
            'What are the main pain points this product solves?'
          ]
        }
      },
      wizardProgressAtom: {
        completedMiniWizards: [
          'CREATE_PRODUCT', 
          'CREATE_BUSINESS_STACK', 
          'CREATE_TECHNICAL_STACK',
          'CREATE_360_QUESTIONS_STACK'
        ],
        currentMiniWizardId: 'CREATE_RULES_STACK',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('rules wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the rules form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the rules form with valid data
  await page.getByTestId('rules-input').fill(`
    1. The application must be responsive and work on all modern browsers
    2. The application must comply with GDPR and CCPA regulations
    3. All user data must be encrypted at rest and in transit
    4. The application must have a dark mode option
    5. The application must be accessible according to WCAG 2.1 AA standards
    6. API response times must be under 300ms for 95% of requests
    7. The application must use Firebase for all backend services
    8. Authentication must be handled through Firebase Auth
    9. State management must use Jotai atoms, not Redux
    10. No IDs should be used in URLs, use Jotai atoms instead
  `);
  
  // Submit the form
  await page.getByTestId('rules-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Rules Created!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
});

test('rules wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the rules form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('rules-submit-button').click();
  
  // Check for validation errors
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill with minimal content
  await page.getByTestId('rules-input').fill('Must use Firebase for backend services');
  
  // Submit the form
  await page.getByTestId('rules-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
