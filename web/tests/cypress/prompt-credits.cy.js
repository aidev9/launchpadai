describe("Prompt Credits System", () => {
  // Test user with email and password for login
  const testUser = {
    email: "test-user@example.com",
    password: "Password123!",
  };

  // Before each test, log in
  beforeEach(() => {
    // Visit the login page and log in
    cy.visit("/auth/signin");
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Wait for login to complete and redirect to dashboard
    cy.url().should("include", "/dashboard");

    // Simulate a logged-in user with some prompt credits
    cy.login(); // Custom command defined in support/commands.js

    // Mock the Firebase prompt credits data
    cy.mockFirebaseCredits({
      remainingCredits: 5,
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 15,
    });
  });

  it("should display prompt credits in the header", () => {
    // Check that the credit balance is visible in the header
    cy.get('[data-cy="credit-balance"]').should("be.visible");
    cy.get('[data-cy="credit-balance"]').should("contain", "5 PC");
  });

  it("should display prompt credits on dashboard", () => {
    // Check that the credit balance component is visible
    cy.contains("Prompt Credits").should("be.visible");
    cy.contains("credits").should("be.visible");

    // The actual credit count will vary, but there should be at least a number displayed
    cy.get(".text-2xl.font-bold").should("contain.text", "credits");
  });

  it("should allow navigation to prompt credits page", () => {
    // Navigate to the prompt credits page
    cy.contains("Prompt Credits").click();
    cy.url().should("include", "/prompt-credits");

    // Verify page content
    cy.contains("What are Prompt Credits?").should("be.visible");
    cy.contains("Free Plan: 10 prompts per day").should("be.visible");
  });

  it("should allow navigation to purchase page", () => {
    // First go to prompt credits page
    cy.visit("/prompt-credits");

    // Click on the Purchase Credits button
    cy.contains("Purchase Credits").click();
    cy.url().should("include", "/prompt-credits/purchase");

    // Verify credit packs are displayed
    cy.contains("300 Prompt Pack").should("be.visible");
    cy.contains("600 Prompt Pack").should("be.visible");
    cy.contains("900 Prompt Pack").should("be.visible");
  });

  it("should display current balance on purchase page", () => {
    cy.visit("/prompt-credits/purchase");

    // Check current balance section
    cy.contains("Current Balance").should("be.visible");
    cy.contains("Your current prompt credit balance").should("be.visible");
  });

  it("should allow selection of a credit pack", () => {
    cy.visit("/prompt-credits/purchase");

    // Select the 300 credit pack
    cy.contains("300 Prompt Pack")
      .parent()
      .parent()
      .within(() => {
        cy.contains("Select").click();
      });

    // Verify selection was successful
    cy.contains("Complete Purchase").should("be.visible");
    cy.contains("You are purchasing the 300 Prompt Pack").should("be.visible");
  });

  // Test AI Naming Assistant with credits
  it("should consume a prompt credit when using the AI Naming Assistant", () => {
    // Start with 5 credits
    cy.mockFirebaseCredits({
      remainingCredits: 5,
      totalUsedCredits: 15,
    });

    cy.visit("/tools/naming-assistant");
    cy.get('[data-cy="naming-prompt-input"]').type(
      "I need a name for my tech startup that focuses on sustainable AI solutions"
    );
    cy.get('[data-cy="submit-naming-prompt"]').click();

    // Verify a credit was consumed
    cy.get('[data-cy="credit-balance"]').should("contain", "4");

    // Verify response was received
    cy.get('[data-cy="naming-assistant-response"]').should("be.visible");
  });

  // Test General Chat Assistant with credits
  it("should consume a prompt credit when using the Chat Assistant", () => {
    // Start with 5 credits
    cy.mockFirebaseCredits({
      remainingCredits: 5,
      totalUsedCredits: 15,
    });

    cy.visit("/dashboard");
    cy.get('[data-cy="chat-widget-button"]').click();
    cy.get('[data-cy="chat-input"]').type(
      "What features does LaunchpadAI offer?"
    );
    cy.get('[data-cy="send-chat-message"]').click();

    // Verify a credit was consumed
    cy.get('[data-cy="credit-balance"]').should("contain", "4");

    // Verify response was received
    cy.get('[data-cy="assistant-message"]').should("be.visible");
  });

  // Test Prompt Enhancer with credits
  it("should consume a prompt credit when enhancing a prompt", () => {
    // Start with 5 credits
    cy.mockFirebaseCredits({
      remainingCredits: 5,
      totalUsedCredits: 15,
    });

    cy.visit("/prompts/prompt");
    cy.get('[data-cy="prompt-input"]').type(
      "Create a landing page for my business"
    );
    cy.get('[data-cy="enhance-prompt-button"]').click();

    // Verify a credit was consumed
    cy.get('[data-cy="credit-balance"]').should("contain", "4");

    // Verify enhanced prompt was received
    cy.get('[data-cy="enhanced-prompt"]').should("be.visible");
  });

  // Test Asset Generation with credits
  it("should consume a prompt credit when generating assets", () => {
    // Start with 5 credits
    cy.mockFirebaseCredits({
      remainingCredits: 5,
      totalUsedCredits: 15,
    });

    cy.visit("/assets/generate");
    cy.get('[data-cy="asset-type-select"]').select("logo");
    cy.get('[data-cy="asset-prompt-input"]').type(
      "A modern logo for a tech startup with blue and green colors"
    );
    cy.get('[data-cy="generate-asset-button"]').click();

    // Verify a credit was consumed
    cy.get('[data-cy="credit-balance"]').should("contain", "4");

    // Verify asset was generated
    cy.get('[data-cy="generated-asset"]').should("be.visible");
  });

  // Test insufficient credits scenario
  it("should show insufficient credits message when user has no credits", () => {
    // Mock zero credits
    cy.mockFirebaseCredits({
      remainingCredits: 0,
      dailyCredits: 10,
      monthlyCredits: 0,
      totalUsedCredits: 20,
    });

    // Test AI Naming Assistant
    cy.visit("/tools/naming-assistant");
    cy.get('[data-cy="naming-prompt-input"]').type(
      "I need a name for my startup"
    );
    cy.get('[data-cy="submit-naming-prompt"]').click();
    cy.get('[data-cy="insufficient-credits-message"]').should("be.visible");
    cy.get('[data-cy="purchase-credits-link"]').should("be.visible");

    // Test General Chat
    cy.visit("/dashboard");
    cy.get('[data-cy="chat-widget-button"]').click();
    cy.get('[data-cy="chat-input"]').type("Help me with my business");
    cy.get('[data-cy="send-chat-message"]').click();
    cy.get('[data-cy="insufficient-credits-message"]').should("be.visible");

    // Test Prompt Enhancer
    cy.visit("/prompts/prompt");
    cy.get('[data-cy="prompt-input"]').type("Create a landing page");
    cy.get('[data-cy="enhance-prompt-button"]').click();
    cy.get('[data-cy="insufficient-credits-message"]').should("be.visible");

    // Test Asset Generation
    cy.visit("/assets/generate");
    cy.get('[data-cy="asset-type-select"]').select("logo");
    cy.get('[data-cy="asset-prompt-input"]').type("A logo for my business");
    cy.get('[data-cy="generate-asset-button"]').click();
    cy.get('[data-cy="insufficient-credits-message"]').should("be.visible");
  });

  // Note: We're not testing the actual payment flow with Stripe
  // as that would require a real Stripe test environment
});

// E2E test for the subscription upgrade flow
describe("Subscription Upgrade & Credit Update", () => {
  const testUser = {
    email: "test-user@example.com",
    password: "Password123!",
  };

  beforeEach(() => {
    cy.visit("/auth/signin");
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
  });

  it("should update credits when subscription changes", () => {
    // This requires mocking the subscription upgrade
    // For a real E2E test, we'd use test API endpoints or Firebase admin SDK to simulate changes
    // This is a simplified version
    cy.visit("/upgrade");

    // Select a plan (Explorer)
    cy.contains("Explorer").click();

    // Check if monthly billing toggle exists and click it
    cy.get("button").contains("Monthly").click();

    // Click continue or next if there's a multi-step process
    // This will vary based on your UI implementation
    cy.get("button")
      .contains(/Continue|Next|Select Plan/i)
      .click();

    // We can't complete the actual payment in the test
    // But we can verify we reached the payment step
    cy.contains(/Payment|Credit Card|Checkout/i).should("be.visible");
  });
});
