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
        currentMiniWizardId: null,
        mainWizardStep: 'INTRODUCTION',
      },
    };
  });
});

test('should navigate through the introduction steps', async ({ page }) => {
  // Navigate to the wizard page
  await page.goto('/wizard');
  
  // Verify the introduction component is visible
  const introComponent = await page.getByTestId('wizard-introduction');
  await expect(introComponent).toBeVisible();
  
  // Check the first step title
  const stepTitle = await page.getByTestId('intro-step-title');
  await expect(stepTitle).toHaveText('Welcome to the AI Journey!');
  
  // Click through all introduction steps
  for (let i = 0; i < 4; i++) {
    // Verify the current step content
    const stepDescription = await page.getByTestId('intro-step-description');
    await expect(stepDescription).toBeVisible();
    
    // Click next button
    await page.getByTestId('intro-next-button').click();
    
    // Wait for animation or state change
    await page.waitForTimeout(300);
  }
  
  // After clicking through all steps, we should be in the mini-wizards step
  // This might need adjustment based on your actual implementation
  await expect(page.url()).toContain('/wizard');
});

test('should complete the product creation wizard', async ({ page }) => {
  // Navigate to the wizard page and get through introduction
  await page.goto('/wizard');
  
  // Skip introduction
  for (let i = 0; i < 4; i++) {
    await page.getByTestId('intro-next-button').click();
    await page.waitForTimeout(300);
  }
  
  // Fill in the product form
  const productName = `Test Product ${uuidv4().substring(0, 8)}`;
  await page.getByTestId('product-name-input').fill(productName);
  await page.getByTestId('product-description-input').fill('This is a test product created by Playwright automated tests');
  
  // Select industry
  await page.getByTestId('product-industry-select').click();
  await page.getByText('Technology').click();
  
  // Submit the form
  await page.getByTestId('product-submit-button').click();
  
  // Verify celebration screen appears
  const celebrationComponent = await page.getByTestId('wizard-celebration');
  await expect(celebrationComponent).toBeVisible();
  
  // Verify XP earned
  const xpEarned = await page.getByTestId('celebration-xp-earned');
  await expect(xpEarned).toContainText('XP');
  
  // Continue to next step
  await page.getByTestId('celebration-continue-button').click();
});

test('full wizard journey', async ({ page }) => {
  // Navigate to the wizard page
  await page.goto('/wizard');
  
  // Complete introduction
  for (let i = 0; i < 4; i++) {
    await page.getByTestId('intro-next-button').click();
    await page.waitForTimeout(300);
  }
  
  // 1. Complete Product Creation
  const productName = `Test Product ${uuidv4().substring(0, 8)}`;
  await page.getByTestId('product-name-input').fill(productName);
  await page.getByTestId('product-description-input').fill('This is a test product created by Playwright automated tests');
  await page.getByTestId('product-industry-select').click();
  await page.getByText('Technology').click();
  await page.getByTestId('product-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // 2. Complete Business Stack (simplified for test)
  // Note: You'll need to add appropriate test IDs to these components
  await page.getByTestId('business-target-audience-input').fill('Small businesses and startups');
  await page.getByTestId('business-value-proposition-input').fill('Saves time and increases productivity');
  await page.getByTestId('business-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // 3. Complete Technical Stack (simplified for test)
  await page.getByTestId('tech-stack-frontend-select').click();
  await page.getByText('React').click();
  await page.getByTestId('tech-stack-backend-select').click();
  await page.getByText('Node.js').click();
  await page.getByTestId('tech-stack-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // 4. Complete 360 Questions
  await page.getByTestId('questions-input').fill('Who are the main competitors?\nWhat are the key features?\nWhat is the pricing model?');
  await page.getByTestId('questions-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // 5. Complete Rules
  await page.getByTestId('rules-input').fill('Must be mobile responsive\nMust comply with GDPR\nMust have dark mode');
  await page.getByTestId('rules-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // 6. Complete Features
  await page.getByTestId('features-input').fill('User authentication\nData visualization\nAPI integration');
  await page.getByTestId('features-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // 7. Complete Notes
  await page.getByTestId('notes-input').fill('Consider adding a mobile app in the future\nExplore AI-powered features');
  await page.getByTestId('notes-submit-button').click();
  
  // Continue after celebration
  await page.getByTestId('celebration-continue-button').click();
  
  // Verify completion screen
  const completionComponent = await page.getByTestId('wizard-completion');
  await expect(completionComponent).toBeVisible();
  
  // Verify completion title
  const completionTitle = await page.getByTestId('completion-title');
  await expect(completionTitle).toHaveText('Congratulations!');
  
  // Verify XP earned
  const completionXp = await page.getByTestId('completion-xp');
  await expect(completionXp).toContainText('XP');
});
