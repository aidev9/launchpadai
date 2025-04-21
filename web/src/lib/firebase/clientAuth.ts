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

/**
 * Creates a session for a user after successful authentication.
 * This sets up the necessary session cookie for server-side auth.
 */
export async function createUserSession(user: User) {
  try {
    // Get the ID token with force refresh to ensure we have the latest token
    const idToken = await user.getIdToken(true);

    console.log("Setting session cookie");

    // Set the session cookie via the API
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Session API error:", response.status, errorData);
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Session created successfully:", result);

    return result;
  } catch (error) {
    console.error("Failed to create session:", error);
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
