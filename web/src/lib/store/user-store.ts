"use client";

import { atom } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";
import { UserProfile } from "../firebase/schema";
import { atomWithQuery } from "jotai-tanstack-query";
import { fetchUserProfile } from "@/lib/firebase/actions/profile";
import { launchpadAiStore } from "./general-store";

// Storage key for user profile
const USER_PROFILE_STORAGE_KEY = "userProfile";

// Function to clear all user-related data from localStorage
const clearUserDataFromStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    // Clear any other user-related data from localStorage
    localStorage.removeItem("accountSettings");
    // Add any other user-related storage keys that need to be cleared
  }
};

// Create a persistent storage atom for user profile
export const userProfileAtom = atomWithStorage<UserProfile | null>(
  USER_PROFILE_STORAGE_KEY,
  null
);

// Create a query atom to fetch user profile
export const userProfileQueryAtom = atomWithQuery<UserProfile | null>(
  (get) => ({
    queryKey: ["userProfileQueryAtom"],
    queryFn: async () => {
      try {
        const result = await fetchUserProfile();
        if (result.success && result.profile) {
          // Clear any previous user data first
          clearUserDataFromStorage();
          // Then set the new user profile
          launchpadAiStore.set(userProfileAtom, result.profile);
          return result.profile;
        }
        return null; // Explicitly return null when conditions aren't met
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - credits can change during usage
  })
);

// Create a derived atom to check if user is authenticated
export const isAuthenticatedAtom = atom((get) => !!get(userProfileAtom));

// Create a derived atom to check if user is an admin
export const isAdminAtom = atom((get) => {
  const userProfile = get(userProfileAtom);
  return (
    userProfile?.userType === "admin" || userProfile?.userType === "superadmin"
  );
});

// Create an atom to get the current user profile
export const getCurrentUserProfileAtom = atom((get) => get(userProfileAtom));

// Action atoms for updating user profile
export const setUserProfileAtom = atom(
  null,
  (get, set, userProfile: UserProfile | null) => {
    // If setting to null (logout), clear storage
    if (userProfile === null) {
      clearUserDataFromStorage();
    } else if (userProfile) {
      // If setting a new user profile, ensure we're not mixing data with previous user
      const currentUserId = get(userProfileAtom)?.uid;
      if (currentUserId && currentUserId !== userProfile.uid) {
        // Different user, clear previous data first
        clearUserDataFromStorage();
      }
    }
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
  // Clear from localStorage
  clearUserDataFromStorage();
  // Reset the atom
  set(userProfileAtom, null);
});

// Account settings atom and update atom
export interface AccountSettings {
  name: string;
  timezone: string;
  language?: string;
  dob?: Date;
}

export const accountAtom = atomWithStorage<AccountSettings | null>(
  "accountSettings",
  null
);

export const updateAccountAtom = atom(
  null,
  (get, set, updates: Partial<AccountSettings>) => {
    const current = get(accountAtom);
    if (current) {
      set(accountAtom, { ...current, ...updates });
    }
  }
);

export const setAccountAtom = atom(
  null,
  (_, set, account: AccountSettings | null) => {
    set(accountAtom, account);
  }
);
