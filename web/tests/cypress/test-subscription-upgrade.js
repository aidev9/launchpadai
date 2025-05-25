// Test script to simulate subscription upgrade and verify prompt credits update
const admin = require("firebase-admin");
const serviceAccount = require("../path-to-your-firebase-admin-sdk.json"); // Replace with actual path
const { verifyPromptCredits } = require("./verify-prompt-credits");
const {
  initializePromptCredits,
} = require("../../src/lib/firebase/prompt-credits");

// Initialize Firebase Admin SDK (skip if already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function simulateSubscriptionUpgrade(userId, fromPlan, toPlan) {
  try {
    console.log(`Simulating subscription upgrade for user: ${userId}`);
    console.log(`Upgrading from ${fromPlan} to ${toPlan}`);

    // First, verify current credits
    console.log(`\n--- Before upgrade (${fromPlan} plan) ---`);
    await verifyPromptCredits(userId, fromPlan);

    // Update user's subscription in Firestore
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error("❌ Error: User document not found!");
      return;
    }

    // Update the user's subscription
    const timestamp = Math.floor(Date.now() / 1000);

    await userRef.update({
      subscription: {
        planType: toPlan,
        billingCycle: "monthly", // Assuming monthly billing for test
        price: getPlanPrice(toPlan),
        status: "active",
        createdAt: timestamp,
        stripeCustomerId: "test_customer_id",
        stripeSubscriptionId: "test_subscription_id",
        paymentIntentId: "test_payment_intent_id",
      },
      updatedAt: timestamp,
    });

    console.log(`✅ Updated user subscription to ${toPlan}`);

    // Update prompt credits based on new plan
    await initializePromptCredits(userId, toPlan);
    console.log(`✅ Updated prompt credits for ${toPlan} plan`);

    // Verify updated credits
    console.log(`\n--- After upgrade (${toPlan} plan) ---`);
    await verifyPromptCredits(userId, toPlan);
  } catch (error) {
    console.error("Error simulating subscription upgrade:", error);
  }
}

function getPlanPrice(planType) {
  switch (planType.toLowerCase()) {
    case "free":
      return 0;
    case "explorer":
      return 29;
    case "builder":
      return 59;
    case "accelerator":
      return 99;
    default:
      return 0;
  }
}

// Usage:
// Simulate upgrading a user from Free to Explorer plan
// simulateSubscriptionUpgrade('USER_ID', 'free', 'explorer');

module.exports = { simulateSubscriptionUpgrade };
