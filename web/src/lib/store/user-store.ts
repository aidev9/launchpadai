"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { UserProfile } from "../firebase/schema";

// Create a persistent storage atom for user profile
export const userProfileAtom = atomWithStorage<UserProfile | null>(
  "userProfile",
  null
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
