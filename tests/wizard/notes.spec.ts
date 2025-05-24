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
        description: 'A test product for notes wizard testing',
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
        },
        features: [
          'User Authentication with Firebase Auth',
          'Real-time data synchronization'
        ]
      },
      wizardProgressAtom: {
        completedMiniWizards: [
          'CREATE_PRODUCT', 
          'CREATE_BUSINESS_STACK', 
          'CREATE_TECHNICAL_STACK',
          'CREATE_360_QUESTIONS_STACK',
          'CREATE_RULES_STACK',
          'ADD_FEATURES'
        ],
        currentMiniWizardId: 'ADD_NOTES',
        mainWizardStep: 'MINI_WIZARDS',
      },
    };
  });
});

test('notes wizard works correctly', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the notes form to be visible
  await page.waitForTimeout(1000);
  
  // Fill in the notes form with valid data
  await page.getByTestId('notes-input').fill(`
    1. Consider adding a mobile app version in the future
    2. Explore AI-powered features for data analysis
    3. Implement a feedback system for continuous improvement
    4. Research integration with popular third-party tools
    5. Plan for internationalization and localization
    6. Consider a referral program for user acquisition
    7. Explore options for a marketplace or plugin ecosystem
    8. Research compliance requirements for enterprise customers
    9. Consider implementing a knowledge base or help center
    10. Plan for regular security audits and penetration testing
  `);
  
  // Submit the form
  await page.getByTestId('notes-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
  
  // Verify celebration title
  const celebrationTitle = await page.getByTestId('celebration-title');
  await expect(celebrationTitle).toHaveText('Notes Added!');
  
  // Verify XP earned is displayed correctly
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify we've moved past the celebration screen
  await expect(celebrationComponent).not.toBeVisible({ timeout: 2000 });
  
  // Verify completion screen appears
  const completionComponent = await page.getByTestId('wizard-completion');
  await expect(completionComponent).toBeVisible({ timeout: 5000 });
  
  // Verify completion title
  const completionTitle = await page.getByTestId('completion-title');
  await expect(completionTitle).toHaveText('Congratulations!');
});

test('notes wizard validates required fields', async ({ page }) => {
  // Navigate directly to the wizard page
  await page.goto('/wizard');
  
  // Wait for the notes form to be visible
  await page.waitForTimeout(1000);
  
  // Try to submit without filling required fields
  await page.getByTestId('notes-submit-button').click();
  
  // Check for validation errors
  await expect(page.locator('text=Required')).toBeVisible();
  
  // Fill with minimal content
  await page.getByTestId('notes-input').fill('Consider adding a mobile app in the future');
  
  // Submit the form
  await page.getByTestId('notes-submit-button').click();
  
  // Verify celebration screen appears, indicating successful submission
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible({ timeout: 5000 });
});
