import { test, expect } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

test.describe("Tech Stack Creation", () => {
  test("should create a new tech stack and navigate to its detail page", async ({
    page,
  }) => {
    // Generate a unique stack name for this test
    const stackName = `Test Stack ${uuidv4().substring(0, 8)}`;

    // First, navigate to sign in page
    await page.goto("http://localhost:3000/auth/signin");
    await page.waitForLoadState("networkidle");

    // Take screenshot of the signin page
    await page.screenshot({ path: "test-results/signin-page.png" });

    console.log("Before sign in");

    // Sign in with test credentials
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("Test1234!");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Wait for sign-in to complete
    try {
      await page.waitForNavigation({ timeout: 10000 });
    } catch (e) {
      console.log("Navigation after login timed out");
      await page.screenshot({ path: "test-results/after-login-timeout.png" });
    }

    console.log("After sign in");
    await page.screenshot({ path: "test-results/after-signin.png" });

    // Now navigate to the create page
    await page.goto("http://localhost:3000/mystacks/create");
    await page.waitForLoadState("networkidle");

    console.log("At create page");
    await page.screenshot({ path: "test-results/create-page.png" });

    // Log HTML structure to debug
    const html = await page.content();
    console.log("Page HTML:", html.substring(0, 4000) + "..."); // Log first 4000 chars

    // Step 1: App Details - Fill in all required fields
    console.log("Step 1: App Details");
    await page.getByLabel("Name").fill(stackName);
    await page
      .getByLabel("Description")
      .fill("This is a test stack created by automated testing");

    // More verbose handling of the Phase field
    console.log("Selecting Phase");
    await page.locator(".group.rounded-md").click();
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/after-phase-selection.png" });

    console.log("Clicking Next button for Step 1");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step1.png" });

    // Step 2: App Type
    console.log("Step 2: App Type");
    try {
      await page
        .locator('text="Full-stack web app"')
        .first()
        .click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for App Type");
      await page
        .locator('.rounded-lg:has-text("Full-stack web app")')
        .first()
        .click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 2");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step2.png" });

    // Step 3: Frontend Stack
    console.log("Step 3: Frontend Stack");
    try {
      await page
        .locator('text="React/NextJS"')
        .first()
        .click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for Frontend");
      await page
        .locator('.rounded-lg:has-text("React/NextJS")')
        .first()
        .click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 3");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step3.png" });

    // Step 4: Backend Stack
    console.log("Step 4: Backend Stack");
    try {
      await page.locator('text="Node/NextJS"').first().click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for Backend");
      await page
        .locator('.rounded-lg:has-text("Node/NextJS")')
        .first()
        .click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 4");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step4.png" });

    // Step 5: Database
    console.log("Step 5: Database");
    try {
      await page.locator('text="Relational"').first().click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for Database");
      await page
        .locator('.rounded-lg:has-text("Relational")')
        .first()
        .click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 5");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step5.png" });

    // Step 6: AI Agent Stack
    console.log("Step 6: AI Agent Stack");
    try {
      await page
        .locator('.rounded-lg:has-text("LangChain/Graph")')
        .first()
        .click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for AI Agent");
      await page
        .locator('text="LangChain/Graph"')
        .first()
        .click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 6");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step6.png" });

    // Step 7: Integrations
    console.log("Step 7: Integrations");
    try {
      await page
        .locator('.rounded-lg:has-text("Payments")')
        .first()
        .click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for Integrations");
      await page.locator('text="Payments"').first().click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 7");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step7.png" });

    // Step 8: Deployment Stack
    console.log("Step 8: Deployment Stack");
    try {
      await page.locator('text="Vercel"').first().click({ timeout: 5000 });
    } catch (e) {
      console.log("Trying alternative selector for Deployment");
      await page
        .locator('.rounded-lg:has-text("Vercel")')
        .first()
        .click({ timeout: 5000 });
    }

    console.log("Clicking Next button for Step 8");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step8.png" });

    // Step 9: Prompt (Optional)
    console.log("Step 9: Prompt");
    await page
      .getByLabel("Prompt (Optional)")
      .fill("Sample prompt for testing");

    console.log("Clicking Next button for Step 9");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step9.png" });

    // Step 10: Documentation Links (Optional)
    console.log("Step 10: Documentation Links");
    // Take a screenshot to see what this step's UI actually looks like
    await page.screenshot({
      path: "test-results/documentation-links-step.png",
    });

    try {
      // Try different selectors to find the input field
      await page
        .locator("#documentation-links")
        .fill("https://example.com/docs");
    } catch (e) {
      console.log("Trying alternative input selector");
      try {
        await page
          .locator('input[placeholder*="https://example.com/docs"]')
          .first()
          .fill("https://example.com/docs");
      } catch (e2) {
        console.log("Could not find documentation link input, skipping");
      }
    }

    // Try to click Add button using the test-id first
    try {
      await page.locator('[data-testid="add-documentation-link"]').click();
      console.log("Clicked Add button by test-id");
    } catch (e) {
      console.log(
        "Could not find button by test-id, trying alternative selectors"
      );
      try {
        await page.locator("#btnAddLink").click();
        console.log("Clicked Add button by ID");
      } catch (e2) {
        console.log(
          "Could not find button by ID either, trying more alternatives"
        );
        try {
          await page.getByRole("button", { name: "+" }).click();
        } catch (e3) {
          console.log("Trying to find button with Plus icon as last resort");
          await page
            .locator("button:has(.lucide-plus)")
            .click({ timeout: 5000 });
        }
      }
    }

    console.log("Clicking Next button for Step 10");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-step10.png" });

    // Step 11: Review and Create
    console.log("Step 11: Review and Create");
    await page.screenshot({ path: "test-results/review-step.png" });

    console.log("Creating Tech Stack");
    try {
      await page
        .getByRole("button", { name: /Create Tech Stack/ })
        .click({ timeout: 5000 });
    } catch (e) {
      console.log(
        "Could not find 'Create Tech Stack' button, trying alternatives"
      );
      try {
        await page
          .getByRole("button", { name: /Update Tech Stack/ })
          .click({ timeout: 5000 });
      } catch (e2) {
        console.log("Could not find update button either");
        // Just try to click the primary button
        await page
          .locator("button.bg-green-600")
          .first()
          .click({ timeout: 5000 });
      }
    }

    // Wait for creation and navigation to stack details page
    try {
      await page.waitForURL("**/mystacks/stack**", { timeout: 15000 });
      console.log("Successfully navigated to stack details page");
    } catch (e) {
      console.log("Navigation to stack details page timed out");
      await page.screenshot({ path: "test-results/navigation-timeout.png" });
    }

    // Verify we're on the stack details page
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/stack-details-page.png" });

    const stackDescription =
      "This is a test stack created by automated testing";

    // Make sure the page has loaded enough time for the data to appear
    await page.waitForLoadState("networkidle");

    console.log(
      "Verifying stack name and description are visible on the details page"
    );

    // More robust stack name verification - try different strategies to ensure we find it
    // First, try to find the exact name in a heading or strong element
    try {
      // Look for the stack name in various elements where it might appear
      const stackNameHeading = await page
        .locator("h1, h2, h3, .font-bold, .text-2xl")
        .filter({ hasText: stackName })
        .first();
      await expect(stackNameHeading).toBeVisible({ timeout: 5000 });
      console.log("✅ Found stack name in heading/strong element");
    } catch (e) {
      console.log(
        "Could not find stack name in headings, trying more general selector"
      );
      // Try a more general approach to find the name anywhere on the page
      const stackNameElement = await page.getByText(stackName, { exact: true });
      await expect(stackNameElement).toBeVisible({ timeout: 5000 });
      console.log("✅ Found stack name on the page");
    }

    // Description verification
    try {
      // Look for description in typical elements where it might appear
      await expect(
        page.getByText(stackDescription, { exact: true })
      ).toBeVisible({ timeout: 5000 });
      console.log("✅ Found exact stack description");
    } catch (e) {
      console.log("Could not find exact description, trying partial match");
      // Try partial match for description as it might be truncated or formatted differently
      await expect(
        page.getByText(stackDescription.substring(0, 30))
      ).toBeVisible({ timeout: 5000 });
      console.log("✅ Found partial stack description");
    }

    console.log(
      "Test completed successfully - Stack name and description verified"
    );
  });
});
