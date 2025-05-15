"use server";

import { adminDb } from "./admin";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { userActionClient } from "@/lib/action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  PromptCredit,
  getPromptCreditsByPlan,
  PromptCreditPack,
} from "./schema";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Initialize or update prompt credits for a user
 */
export async function initializePromptCredits(
  userId: string,
  planType: string
) {
  try {
    const now = getCurrentUnixTimestamp();
    const { daily, monthly } = getPromptCreditsByPlan(planType);

    // Check if prompt credits already exist for this user
    const creditsRef = adminDb.collection("prompt_credits").doc(userId);
    const doc = await creditsRef.get();

    if (doc.exists) {
      // Update the existing credits based on plan
      await creditsRef.update({
        dailyCredits: daily,
        monthlyCredits: monthly,
        remainingCredits: monthly > 0 ? monthly : daily, // Use monthly credits if available
        lastRefillDate: now,
        updatedAt: now,
      });
    } else {
      // Create new prompt credits document
      await creditsRef.set({
        userId,
        dailyCredits: daily,
        monthlyCredits: monthly,
        remainingCredits: monthly > 0 ? monthly : daily, // Use monthly credits if available
        totalUsedCredits: 0,
        lastRefillDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error initializing prompt credits:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get prompt credits for a user
 */
export async function getPromptCredits(userId: string): Promise<{
  success: boolean;
  credits?: PromptCredit;
  error?: string;
}> {
  try {
    // Check if prompt credits exist for this user
    const creditsRef = adminDb.collection("prompt_credits").doc(userId);
    const doc = await creditsRef.get();

    if (!doc.exists) {
      // Initialize prompt credits if they don't exist
      console.error(`No prompt credits found for user ${userId}`);

      // Check if the user has a paid plan
      const userDoc = await adminDb.collection("users").doc(userId).get();
      let planType = "free";
      if (userDoc.exists) {
        const userData = userDoc.data();
        planType = userData?.subscription?.planType?.toLowerCase() || "free";
      }

      await initializePromptCredits(userId, planType);

      // return {
      //   success: false,
      //   error: "No prompt credits found for this user",
      // };

      return {
        success: true,
        // error: "User initialized with free plan",
      };
    }

    const creditsData = doc.data() as PromptCredit;

    // Handle daily refill for free plan users
    // if (creditsData.dailyCredits > 0 && creditsData.monthlyCredits === 0) {
    //   const lastRefillDate = creditsData.lastRefillDate || 0;
    //   const now = getCurrentUnixTimestamp();
    //   const oneDayInSeconds = 86400; // 24 hours in seconds

    //   // Check if it's been more than a day since the last refill
    //   if (now - lastRefillDate > oneDayInSeconds) {
    //     // Refill daily credits
    //     await creditsRef.update({
    //       remainingCredits: creditsData.dailyCredits,
    //       lastRefillDate: now,
    //       updatedAt: now,
    //     });

    //     // Update the credits data to reflect the refill
    //     creditsData.remainingCredits = creditsData.dailyCredits;
    //     creditsData.lastRefillDate = now;
    //     creditsData.updatedAt = now;
    //   }
    // }

    return { success: true, credits: creditsData };
  } catch (error) {
    console.error("Error getting prompt credits:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Use prompt credits for a single prompt
 */
export const consumePromptCredit = userActionClient
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { userId } = parsedInput;

      // Get reference to user's prompt credits
      const creditsRef = adminDb.collection("prompt_credits").doc(userId);
      const doc = await creditsRef.get();

      if (!doc.exists) {
        return { success: false, error: "No prompt credits found" };
      }

      const creditsData = doc.data() as PromptCredit;

      // Check if user has enough credits
      if (creditsData.remainingCredits <= 0) {
        return {
          success: false,
          error: "Insufficient prompt credits",
          needMoreCredits: true,
        };
      }

      // Update credits (decrement remaining, increment used)
      await creditsRef.update({
        remainingCredits: FieldValue.increment(-1),
        totalUsedCredits: FieldValue.increment(1),
        updatedAt: getCurrentUnixTimestamp(),
      });

      revalidatePath("/dashboard");
      return {
        success: true,
        remainingCredits: creditsData.remainingCredits - 1,
      };
    } catch (error) {
      console.error("Error using prompt credit:", error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Add prompt credits from a purchased pack
 */
export const addPromptCredits = userActionClient
  .schema(
    z.object({
      userId: z.string(),
      credits: z.number().min(1),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const { userId, credits } = parsedInput;
      console.log(
        `addPromptCredits called for user ${userId} to add ${credits} credits`
      );

      // Get reference to user's prompt credits
      const creditsRef = adminDb.collection("prompt_credits").doc(userId);
      const doc = await creditsRef.get();

      if (!doc.exists) {
        console.error(`User ${userId} has no prompt credits record`);
        return { success: false, error: "No prompt credits found" };
      }

      const beforeCredits = doc.data()?.remainingCredits || 0;
      console.log(
        `Before adding credits: User ${userId} has ${beforeCredits} credits`
      );

      // Check if there's a potential duplicate call or multiplication issue
      // If we're adding more than 1000 credits at once, it's likely an error
      if (credits > 1000) {
        console.error(
          `Attempted to add ${credits} credits, which exceeds safe limit of 1000.`
        );
        return {
          success: false,
          error: "Credit amount exceeds safe limit. Please contact support.",
        };
      }

      // Update credits (increment remaining)
      await creditsRef.update({
        remainingCredits: FieldValue.increment(credits),
        updatedAt: getCurrentUnixTimestamp(),
      });

      // Verify the credits were added correctly
      const afterDoc = await creditsRef.get();
      const afterCredits = afterDoc.data()?.remainingCredits || 0;
      console.log(
        `After adding credits: User ${userId} now has ${afterCredits} credits`
      );

      // If there's a massive unexpected increase, log it as an error
      if (afterCredits > beforeCredits + credits + 100) {
        // Allow for some buffer in case of concurrent operations
        console.error(
          `CREDIT ANOMALY DETECTED: Expected increase of ${credits}, but actual increase was ${afterCredits - beforeCredits}`
        );
      }

      revalidatePath("/dashboard");
      revalidatePath("/prompt-credits/purchase");

      return {
        success: true,
        before: beforeCredits,
        added: credits,
        after: afterCredits,
      };
    } catch (error) {
      console.error("Error adding prompt credits:", error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Record a credit pack purchase
 */
export async function recordPromptPackPurchase(
  userId: string,
  pack: PromptCreditPack,
  paymentIntentId: string,
  customerId: string
) {
  try {
    const now = getCurrentUnixTimestamp();

    // Log the pack details for debugging
    console.log(`Processing purchase for pack with details:`, {
      packId: pack.id,
      packName: pack.name,
      packCredits: pack.credits,
      packPrice: pack.price,
    });

    // Record the purchase
    await adminDb.collection("prompt_credit_purchases").add({
      userId,
      packId: pack.id,
      packName: pack.name,
      credits: pack.credits,
      price: pack.price,
      paymentIntentId,
      stripeCustomerId: customerId,
      status: "completed",
      createdAt: now,
    });

    // Get the current credits to verify after update
    const creditsRef = adminDb.collection("prompt_credits").doc(userId);
    const beforeDoc = await creditsRef.get();
    const beforeCredits = beforeDoc.exists
      ? beforeDoc.data()?.remainingCredits || 0
      : 0;
    console.log(
      `Before adding credits: User ${userId} has ${beforeCredits} credits`
    );

    // Ensure we're adding exactly the number of credits from the pack
    // Instead of using addPromptCredits action, update directly to ensure correct amount
    await creditsRef.update({
      remainingCredits: FieldValue.increment(pack.credits),
      updatedAt: now,
    });

    // Verify the credits were added correctly
    const afterDoc = await creditsRef.get();
    const afterCredits = afterDoc.exists
      ? afterDoc.data()?.remainingCredits || 0
      : 0;
    console.log(
      `After adding credits: User ${userId} has ${afterCredits} credits (added ${pack.credits})`
    );

    // If the credits were added incorrectly (more than expected), fix it
    if (afterCredits > beforeCredits + pack.credits) {
      console.error(`Credit discrepancy detected! Added too many credits. 
        Expected: ${beforeCredits} + ${pack.credits} = ${beforeCredits + pack.credits}. 
        Actual: ${afterCredits}`);

      // Fix the credits to be exactly what they should be
      await creditsRef.update({
        remainingCredits: beforeCredits + pack.credits,
        updatedAt: now,
      });

      console.log(
        `Credit balance fixed. Set to ${beforeCredits + pack.credits} credits`
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/prompt-credits/purchase");

    return {
      success: true,
      message: `Added ${pack.credits} credits successfully.`,
      before: beforeCredits,
      after: beforeCredits + pack.credits,
    };
  } catch (error) {
    console.error("Error recording prompt pack purchase:", error);
    return { success: false, error: String(error) };
  }
}
