'use client'

import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase client configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase client for browser environments
function getFirebaseClientApp() {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]
  }

  return initializeApp(firebaseConfig)
}

export const clientApp = getFirebaseClientApp()

// Initialize Auth with proper persistence for better integration with Next.js
export const clientAuth =
  typeof window !== 'undefined'
    ? initializeAuth(clientApp, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      })
    : getAuth(clientApp)

export const clientDb = getFirestore(
  clientApp,
  process.env.FIRESTORE_DATABASE_NAME as string
)
