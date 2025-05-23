import {
  User,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { clientAuth, signOutUser } from "@/lib/firebase/client";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Creates a session for a user after successful authentication.
 * This sets up the necessary session cookie for server-side auth.
 */
export async function createUserSession(user: User) {
  try {
    // Get the ID token with force refresh to ensure we have the latest token
    const idToken = await user.getIdToken(true);

    // Set the session cookie via the API
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      await response.json().catch(() => ({}));
      // console.error("Session API error:", response.status, errorData);
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    // console.error("Failed to create session:", error);
    throw error;
  }
}

/**
 * Handles email/password sign in with Firebase Auth.
 * @param email User's email
 * @param password User's password
 * @returns An object containing user credentials and session information
 */
export async function handleEmailPasswordSignIn(
  email: string,
  password: string
) {
  if (!clientAuth) {
    console.error("Firebase Auth is not initialized properly");
    throw new Error("Authentication service not available");
  }

  console.log("Attempting to sign in with:", email);

  // Clear out any previous persisted auth state
  await clientAuth.signOut();

  // Perform client-side Firebase authentication
  const userCredential = await signInWithEmailAndPassword(
    clientAuth,
    email,
    password
  );

  console.log("Authentication successful, creating session");

  // Create the session using our dedicated function
  await createUserSession(userCredential.user);

  return userCredential;
}

/**
 * Handles social sign-in with various providers (Google, Facebook, Twitter, Github)
 * @param provider The social provider to use for authentication
 * @returns A promise that resolves with the UserCredential if successful
 */
export async function handleSocialSignIn(
  provider: "google" | "facebook" | "twitter" | "github"
) {
  try {
    if (!clientAuth) {
      throw new Error("Firebase Auth is not initialized");
    }

    let authProvider;

    switch (provider) {
      case "google":
        authProvider = new GoogleAuthProvider();
        break;
      case "facebook":
        authProvider = new FacebookAuthProvider();
        break;
      case "twitter":
        authProvider = new TwitterAuthProvider();
        break;
      case "github":
        authProvider = new GithubAuthProvider();
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Add scopes and custom parameters for each provider
    if (authProvider instanceof GoogleAuthProvider) {
      authProvider.addScope("email");
      authProvider.addScope("profile");
    } else if (authProvider instanceof GithubAuthProvider) {
      authProvider.addScope("user");
      authProvider.addScope("email");
    }

    // Clear any existing auth state
    // await clientAuth.signOut();
    await signOutUser();

    const result = await signInWithPopup(clientAuth, authProvider);

    if (!result.user) {
      throw new Error("No user data received from provider");
    }

    // Ensure the user record exists in Firestore
    await ensureUserInFirestore(result.user, provider);

    // Create session using our dedicated function
    await createUserSession(result.user);
    return result;
  } catch (error) {
    console.error(`Error signing in with ${provider}:`, error);

    // Handle specific auth errors
    if (error === "auth/popup-blocked") {
      throw new Error(
        "Sign-in popup was blocked. Please allow popups and try again."
      );
    }
    if (error === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled. Please try again.");
    }
    if (error === "auth/account-exists-with-different-credential") {
      throw new Error(
        "An account already exists with the same email address but different sign-in credentials."
      );
    }

    throw error;
  }
}

/**
 * Ensures a user record exists in Firestore
 * If the user doesn't have a record yet, creates one (effectively signing them up)
 * @param user Firebase Auth user
 * @param provider Authentication provider used
 */
async function ensureUserInFirestore(
  user: User,
  provider: "google" | "facebook" | "twitter" | "github"
) {
  try {
    // Import the server action dynamically to prevent SSR issues
    const { ensureUserInFirestoreAction } = await import(
      "@/lib/firebase/actions/user"
    );

    const timestamp = getCurrentUnixTimestamp();

    // Call the server action directly
    const result = await ensureUserInFirestoreAction(user.uid, {
      name: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      provider,
      createdAt: timestamp,
    });

    // Log the result for debugging
    if (!result.success) {
      console.warn("Failed to ensure user record:", result.error);
    }

    return result;
  } catch (error) {
    console.error("Error ensuring user in Firestore:", error);
    // Don't throw the error as we want the sign-in to continue
    // even if the user record creation fails
    return { success: false, error: String(error) };
  }
}
