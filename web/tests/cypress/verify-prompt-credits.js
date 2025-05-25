// Test script to verify prompt credits initialization
const admin = require("firebase-admin");
const serviceAccount = require("../path-to-your-firebase-admin-sdk.json"); // Replace with actual path

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function verifyPromptCredits(userId, expectedPlan) {
  try {
    console.log(
      `Verifying prompt credits for user: ${userId} with plan: ${expectedPlan}`
    );

    // Get the user's prompt credits document
    const creditsDoc = await db.collection("prompt_credits").doc(userId).get();

    if (!creditsDoc.exists) {
      console.error(
        "❌ Error: No prompt credits document found for this user!"
      );
      return;
    }

    const creditsData = creditsDoc.data();
    console.log("Prompt credits data:", creditsData);

    // Verify the credits match the expected plan
    const expectedValues = getExpectedCreditsByPlan(expectedPlan);

    // Check daily credits
    if (creditsData.dailyCredits !== expectedValues.daily) {
      console.error(
        `❌ Error: Daily credits mismatch. Expected ${expectedValues.daily}, got ${creditsData.dailyCredits}`
      );
    } else {
      console.log(`✅ Daily credits match: ${creditsData.dailyCredits}`);
    }

    // Check monthly credits
    if (creditsData.monthlyCredits !== expectedValues.monthly) {
      console.error(
        `❌ Error: Monthly credits mismatch. Expected ${expectedValues.monthly}, got ${creditsData.monthlyCredits}`
      );
    } else {
      console.log(`✅ Monthly credits match: ${creditsData.monthlyCredits}`);
    }

    // Check remaining credits
    const expectedRemaining =
      expectedValues.monthly > 0
        ? expectedValues.monthly
        : expectedValues.daily;
    if (creditsData.remainingCredits !== expectedRemaining) {
      console.error(
        `❌ Error: Remaining credits mismatch. Expected ${expectedRemaining}, got ${creditsData.remainingCredits}`
      );
    } else {
      console.log(
        `✅ Remaining credits match: ${creditsData.remainingCredits}`
      );
    }
  } catch (error) {
    console.error("Error verifying prompt credits:", error);
  }
}

function getExpectedCreditsByPlan(planType) {
  switch (planType.toLowerCase()) {
    case "free":
      return { daily: 10, monthly: 0 };
    case "explorer":
      return { daily: 0, monthly: 300 };
    case "builder":
      return { daily: 0, monthly: 600 };
    case "accelerator":
      return { daily: 0, monthly: 900 };
    default:
      return { daily: 10, monthly: 0 };
  }
}

// Usage:
// Replace 'USER_ID' with the actual Firebase user ID and 'PLAN_TYPE' with the user's subscription plan
// verifyPromptCredits('USER_ID', 'PLAN_TYPE');

module.exports = { verifyPromptCredits };
