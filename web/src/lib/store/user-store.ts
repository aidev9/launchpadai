"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Define the user profile interface
export interface UserProfile {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  isEmailVerified?: boolean;
  createdAt?: string;
  xp?: number;
  level?: number;
  hasAnsweredTimelineQuestion?: boolean;
  hasCompletedOnboarding?: boolean;
  lastLogin?: string;
  completedQuests?: string[];
  // Add other fields as needed based on your app
}

// Create a persistent storage atom for user profile
export const userProfileAtom = atomWithStorage<UserProfile | null>(
  "userProfile",
  null
);

// Create a derived atom to check if user is authenticated
export const isAuthenticatedAtom = atom((get) => !!get(userProfileAtom));

// Create an atom to get the current user profile
export const getCurrentUserProfileAtom = atom((get) => get(userProfileAtom));

// Action atoms for updating user profile
export const setUserProfileAtom = atom(
  null,
  (_, set, userProfile: UserProfile | null) => {
    set(userProfileAtom, userProfile);
  }
);

// Atom for updating specific user profile fields
export const updateUserProfileAtom = atom(
  null,
  (get, set, updates: Partial<UserProfile>) => {
    const currentProfile = get(userProfileAtom);
    if (currentProfile) {
      set(userProfileAtom, { ...currentProfile, ...updates });
    }
  }
);

// Atom to clear user profile (for logout)
export const clearUserProfileAtom = atom(null, (_, set) => {
  set(userProfileAtom, null);
});
