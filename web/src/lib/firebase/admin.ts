import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK for server-side components
function getFirebaseAdminApp() {
  console.log("-----------------getFirebaseAdminApp-----------------");
  const apps = getApps();
  console.log("apps", apps);
  if (apps.length > 0) {
    return apps[0];
  }

  // Check if Firebase credentials are available
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIRESTORE_DATABASE_NAME
  ) {
    throw new Error(
      "Firebase admin credentials are not configured properly. Please set the FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key needs to be correctly formatted
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminApp = getFirebaseAdminApp();
export const adminDb = getFirestore(
  adminApp,
  process.env.FIRESTORE_DATABASE_NAME as string
);
export const adminAuth = getAuth(adminApp);
