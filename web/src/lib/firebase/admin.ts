import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK for server-side components
function getFirebaseAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  // Check if Firebase credentials are available
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIRESTORE_DATABASE_NAME ||
    !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ) {
    throw new Error(
      "Firebase admin credentials are not configured properly. Please set the FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIRESTORE_DATABASE_NAME, and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variables."
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key needs to be correctly formatted
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    databaseURL: `https://${process.env.FIRESTORE_DATABASE_NAME}.firebaseio.com/`,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminApp = getFirebaseAdminApp();

// Ensure the database name is properly set
const dbName = process.env.FIRESTORE_DATABASE_NAME;
if (!dbName) {
  console.error("FIRESTORE_DATABASE_NAME is not set! Using default database.");
}

export const adminDb = getFirestore(adminApp, dbName || "default");

console.log(
  `[Firebase Admin] Initialized Firestore with database: ${dbName || "default"}`
);

export const adminAuth = getAuth(adminApp);
