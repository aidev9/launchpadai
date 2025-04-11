"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Example of a basic atom for global state
export const countAtom = atom<number>(0);

// Example of a theme atom with localStorage persistence
export const themeAtom = atomWithStorage<"light" | "dark">("theme", "light");

// Example of a user atom for authentication state
export const userAtom = atom<{
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} | null>(null);

// Atoms can be derived from other atoms
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

// Atoms can also have a write function
export const incrementCountAtom = atom(
  (get) => get(countAtom),
  (get, set) => set(countAtom, get(countAtom) + 1)
);
