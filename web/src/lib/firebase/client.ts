"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, indexedDBLocalPersistence, signOut } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { clearUserProfileAtom } from "@/lib/store/user-store";

// Firebase client configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client for browser environments
function getFirebaseClientApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  return initializeApp(firebaseConfig);
}

export const clientApp = getFirebaseClientApp();

// Initialize Auth with proper persistence for better integration with Next.js
export const clientAuth = getAuth(clientApp);
clientAuth.setPersistence(
  typeof window !== "undefined"
    ? indexedDBLocalPersistence
    : indexedDBLocalPersistence
);
// typeof window !== "undefined"
//   ? initializeAuth(clientApp, {
//       persistence: [indexedDBLocalPersistence, browserLocalPersistence],
//     })
//   : getAuth(clientApp);

export const clientDb = getFirestore(
  clientApp,
  process.env.FIRESTORE_DATABASE_NAME as string
);

// Enable offline persistence for Firestore
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(clientDb).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.warn("Firestore persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn("Firestore persistence is not available in this browser");
    } else {
      console.error("Firestore persistence error:", err);
    }
  });
}

// Note: This hook usage might need to be moved to a component context
// if client.ts is not guaranteed to be used within a Jotai Provider scope.
// For simplicity, we assume it's used correctly for now.
// A safer approach would be to trigger this from the calling component.

export const SignOutHelper = () => {
  const clearProfile = useSetAtom(clearUserProfileAtom);

  const signOutAndClear = async (router?: ReturnType<typeof useRouter>) => {
    try {
      await signOut(clientAuth);
      // Clear session cookies
      await fetch("/api/auth/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Clear the Jotai atom state
      clearProfile();
      console.log("User profile atom cleared.");

      // Route to the home page or any other page
      // Only navigate if router is provided
      if (router) {
        router.push("/");
        router.refresh(); // Ensure the UI updates
      }
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out user:", error);
    }
  };

  return signOutAndClear;
};

// Keep the original export structure, but refactor its usage
// This function itself cannot directly use hooks.
// Components calling sign out should use the SignOutHelper or similar pattern.
export const signOutUser = async (router?: ReturnType<typeof useRouter>) => {
  // The actual clearing logic needs to be invoked via the helper hook from a component.
  console.warn(
    "signOutUser called directly. Jotai state clearing must be handled by the calling component using SignOutHelper or similar."
  );
  try {
    await signOut(clientAuth);
    // Clear session cookies
    await fetch("/api/auth/session", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Route to the home page or any other page
    if (router) {
      router.push("/");
      router.refresh();
    }
    console.log("User signed out (session cleared, routing done).");
  } catch (error) {
    console.error("Error signing out user (core logic):", error);
  }
};
