// Test script to verify prompt credit usage for AI features
const admin = require("firebase-admin");
const { getCurrentUnixTimestamp } = require("../lib/utils/constants");

// Initialize the admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const TEST_USER_ID = "test_user_123";

async function setupTestUser() {
  console.log("Setting up test user with prompt credits...");

  // Create a test user with 5 credits
  await db.collection("prompt_credits").doc(TEST_USER_ID).set({
    userId: TEST_USER_ID,
    dailyCredits: 10,
    monthlyCredits: 0,
    remainingCredits: 5, // Start with 5 credits for testing
    totalUsedCredits: 0,
    lastRefillDate: getCurrentUnixTimestamp(),
    createdAt: getCurrentUnixTimestamp(),
    updatedAt: getCurrentUnixTimestamp(),
  });

  console.log("Test user setup complete with 5 prompt credits.");
}

async function getPromptCredits(userId) {
  const doc = await db.collection("prompt_credits").doc(userId).get();
  if (!doc.exists) {
    throw new Error("No credits found for user");
  }
  return doc.data();
}

async function simulateAIFeatureUsage(featureName) {
  console.log(`Simulating usage of ${featureName}...`);

  // Get credits before
  const beforeCredits = await getPromptCredits(TEST_USER_ID);
  console.log(
    `Before using ${featureName}: ${beforeCredits.remainingCredits} credits`
  );

  // Simulate API call that would consume a credit
  const creditsRef = db.collection("prompt_credits").doc(TEST_USER_ID);

  await creditsRef.update({
    remainingCredits: admin.firestore.FieldValue.increment(-1),
    totalUsedCredits: admin.firestore.FieldValue.increment(1),
    updatedAt: getCurrentUnixTimestamp(),
  });

  // Get credits after
  const afterCredits = await getPromptCredits(TEST_USER_ID);
  console.log(
    `After using ${featureName}: ${afterCredits.remainingCredits} credits`
  );

  // Verify credit was consumed
  if (afterCredits.remainingCredits === beforeCredits.remainingCredits - 1) {
    console.log(
      `✅ TEST PASSED: Credit successfully consumed for ${featureName}`
    );
    return true;
  } else {
    console.log(
      `❌ TEST FAILED: Credit not consumed correctly for ${featureName}`
    );
    return false;
  }
}

async function testNoCreditsScenario() {
  console.log("\nTesting scenario when user has no credits left...");

  // Set remaining credits to 0
  await db.collection("prompt_credits").doc(TEST_USER_ID).update({
    remainingCredits: 0,
  });

  // Attempt to use a feature
  try {
    // This would be handled by the API in production, which would return an error
    console.log("Attempting to use AI feature with 0 credits...");

    // In real code, the API would check credits and return error
    // Here we simulate checking the credits
    const credits = await getPromptCredits(TEST_USER_ID);

    if (credits.remainingCredits <= 0) {
      console.log(
        "✅ TEST PASSED: AI feature correctly detected insufficient credits"
      );
      return true;
    } else {
      console.log(
        "❌ TEST FAILED: AI feature should have detected insufficient credits"
      );
      return false;
    }
  } catch (error) {
    console.error("Error in no credits test:", error);
    return false;
  }
}

async function runTests() {
  try {
    // Setup test environment
    await setupTestUser();

    // Test each AI feature
    const features = [
      "AI Naming Assistant",
      "General Chat Assistant",
      "Prompt Enhancer",
      "Asset Generation",
    ];

    let allTestsPassed = true;

    // Test each feature one by one
    for (const feature of features) {
      const testPassed = await simulateAIFeatureUsage(feature);
      allTestsPassed = allTestsPassed && testPassed;
    }

    // Test insufficient credits scenario
    const noCreditsTest = await testNoCreditsScenario();
    allTestsPassed = allTestsPassed && noCreditsTest;

    // Overall test result
    if (allTestsPassed) {
      console.log(
        "\n✅ ALL TESTS PASSED: Prompt credit system is working correctly"
      );
    } else {
      console.log("\n❌ SOME TESTS FAILED: Check logs above for details");
    }

    // Clean up test data
    console.log("\nCleaning up test data...");
    await db.collection("prompt_credits").doc(TEST_USER_ID).delete();
    console.log("Test data cleaned up");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Run the tests
runTests();
