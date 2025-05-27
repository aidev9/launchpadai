"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { Resend } from "resend";
import {
  createInvitationEmail,
  invitationSchema,
} from "@/lib/emails/invitation";
import { initializePromptCredits } from "@/lib/firebase/prompt-credits";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Get the price for a subscription plan
 */
function getPlanPrice(planType: string): number {
  switch (planType) {
    case "accelerator":
      return 99.99;
    case "builder":
      return 49.99;
    case "explorer":
      return 19.99;
    case "free":
    default:
      return 0;
  }
}

/**
 * Send an invitation email to a new user
 */
async function sendInvitationEmail(
  email: string,
  name: string,
  invitationUrl: string
): Promise<void> {
  try {
    // Create a record in Firestore to store the invitation
    await adminDb.collection("invitations").add({
      email,
      name,
      invitationUrl,
      createdAt: getCurrentUnixTimestamp(),
      status: "pending",
    });

    // Validate invitation data
    const invitationData = invitationSchema.parse({
      email,
      name,
      invitationUrl,
    });

    // Generate email content using the template
    const { subject, html, text } = createInvitationEmail({
      invitation: invitationData,
    });

    // Send email using Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "info@launchpadai.io",
      to: email,
      subject: subject,
      html: html,
      text: text,
    });

    console.log(`Invitation email sent to ${email}`);

    // Update the user record with the invitation URL
    const userSnapshot = await adminDb
      .collection("users")
      .where("email", "==", email)
      .get();
    if (!userSnapshot.empty) {
      const userId = userSnapshot.docs[0].id;
      await adminDb.collection("users").doc(userId).update({
        invitationUrl,
        invitationSentAt: getCurrentUnixTimestamp(),
      });
    }

    return Promise.resolve();
  } catch (error) {
    console.error("Error sending invitation email:", error);
    // Don't throw here, just log the error
    return Promise.resolve();
  }
}

/**
 * Invite a new user by creating their account in Firebase
 */
export async function inviteUser(
  email: string,
  name: string,
  subscriptionLevel: string
) {
  try {
    const timestamp = getCurrentUnixTimestamp();
    let userRecord;
    let isExistingUser = false;

    // Check if user already exists in Firebase Auth
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      isExistingUser = true;
      console.log(`User ${email} already exists, sending new invitation`);
    } catch (error) {
      // User doesn't exist, create a new one
      console.log(`Creating new user for ${email}`);

      // Generate a random password for the initial account
      const tempPassword = Math.random().toString(36).slice(-8);

      // Create user in Firebase Auth
      userRecord = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: name,
      });
    }

    // Create subscription object
    const subscriptionData = {
      userId: userRecord.uid,
      planType: subscriptionLevel.toLowerCase(),
      billingCycle: "monthly", // Default to monthly
      price: getPlanPrice(subscriptionLevel.toLowerCase()),
      status: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      paymentIntentId: null,
    };

    // Generate invitation URL
    const invitationUrl = await generateInvitationUrl(email);

    // Store subscription in the subscriptions collection
    console.log(
      `Storing subscription for user ${userRecord.uid} in subscriptions collection`
    );
    await adminDb
      .collection("subscriptions")
      .doc(userRecord.uid)
      .set(subscriptionData);

    // Initialize prompt credits based on subscription level
    console.log(
      `Initializing prompt credits for user ${userRecord.uid} with plan ${subscriptionLevel.toLowerCase()}`
    );
    await initializePromptCredits(
      userRecord.uid,
      subscriptionLevel.toLowerCase()
    );

    if (isExistingUser) {
      // For existing users, only update the invitation fields
      const userDoc = adminDb.collection("users").doc(userRecord.uid);

      // Get current user data
      const userData = await userDoc.get();

      if (userData.exists) {
        // Update only specific fields without overwriting existing profile data
        await userDoc.update({
          inviteSubscription: subscriptionLevel.toLowerCase(), // Keep this for reference
          invitationUrl: invitationUrl,
          invitationSentAt: timestamp,
          // Update displayName only if it's empty or if the new name is provided
          ...((!userData.data()?.displayName || name) && { displayName: name }),
        });
      } else {
        // User exists in Auth but not in Firestore, create the document
        await userDoc.set({
          email,
          displayName: name,
          userType: "user",
          inviteSubscription: subscriptionLevel.toLowerCase(), // Keep this for reference
          createdAt: timestamp,
          isEmailVerified: false,
          invitationUrl: invitationUrl,
          invitationSentAt: timestamp,
        });
      }
    } else {
      // For new users, create a complete profile
      await adminDb.collection("users").doc(userRecord.uid).set({
        email,
        displayName: name,
        userType: "user",
        inviteSubscription: subscriptionLevel.toLowerCase(), // Keep this for reference
        createdAt: timestamp,
        isEmailVerified: false,
        invitationUrl: invitationUrl,
        invitationSentAt: timestamp,
      });
    }

    // Send invitation email with invitation URL
    await sendInvitationEmail(email, name, invitationUrl);

    revalidatePath("/admin/users");

    // Return only the necessary user information to avoid serialization issues
    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      },
      invitationUrl,
      isExistingUser,
    };
  } catch (error) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate an invitation URL for a user to complete their signup
 */
async function generateInvitationUrl(email: string) {
  try {
    // Use a hardcoded URL for now since NEXT_PUBLIC_APP_URL might not be set
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Generate a sign-in link with email link
    const actionCodeSettings = {
      url: `${appUrl}/auth/complete-signup?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };

    // For development purposes, return a mock URL if Firebase auth fails
    try {
      // Generate the email sign-in link
      const signInLink = await adminAuth.generateSignInWithEmailLink(
        email,
        actionCodeSettings
      );
      return signInLink;
    } catch (authError) {
      console.warn(
        "Firebase auth link generation failed, using mock URL:",
        authError
      );
      // Return a mock URL for development
      return `${appUrl}/auth/complete-signup?email=${encodeURIComponent(email)}&mockInvite=true`;
    }
  } catch (error) {
    console.error("Error generating invitation URL:", error);
    // Return a fallback URL instead of throwing
    return `/auth/complete-signup?email=${encodeURIComponent(email)}&fallback=true`;
  }
}
