import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  CollectionReference, 
  DocumentReference, 
  Firestore 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
console.log('[Firebase] Firebase app initialized or using existing app');

// Ensure the database name is properly set
const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || 'launchpadai';
if (!dbName) {
  console.error("NEXT_PUBLIC_FIRESTORE_DATABASE_NAME is not set! Using default database.");
}

// Initialize Firestore with specific database
const db = getFirestore(app, dbName);
console.log(`[Firebase] Initialized Firestore with database: ${dbName}`);

// Initialize Auth
const auth = getAuth(app);
console.log('[Firebase] Auth initialized');

// Initialize Storage
const storage = getStorage(app);
console.log('[Firebase] Storage initialized');

// Initialize Analytics (only in browser environment and if supported)
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('[Firebase] Analytics initialized');
    } else {
      console.log('[Firebase] Analytics not supported in this environment');
    }
  });
}

// Firebase client utility functions
export function getCollection<T>(collectionPath: string): CollectionReference<T> {
  return collection(db, collectionPath) as CollectionReference<T>;
}

export function getDocRef<T>(collectionPath: string, docId: string): DocumentReference<T> {
  return doc(db, collectionPath, docId) as DocumentReference<T>;
}

export function getSubcollectionRef<T>(
  parentCollectionPath: string,
  docId: string,
  subcollectionPath: string
): CollectionReference<T> {
  return collection(
    db, 
    parentCollectionPath, 
    docId, 
    subcollectionPath
  ) as CollectionReference<T>;
}

export function getSubDocRef<T>(
  parentCollectionPath: string,
  docId: string,
  subcollectionPath: string,
  subDocId: string
): DocumentReference<T> {
  return doc(
    db, 
    parentCollectionPath, 
    docId, 
    subcollectionPath, 
    subDocId
  ) as DocumentReference<T>;
}

export { app, db, auth, storage, analytics };
