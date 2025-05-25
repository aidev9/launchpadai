import { atom } from "jotai";
import { UserProfile } from "@/lib/firebase/schema";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

// Define types for user status and filters
export type UserStatus = "active" | "inactive" | "invited" | "suspended";
export type UserType = "user" | "admin" | "superadmin";
export type SubscriptionLevel = "free" | "explorer" | "builder" | "accelerator";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([{ id: "createdAt", desc: true }]);
export const usersAtom = atom<UserProfile[]>([]);
export const isLoadingAtom = atom<boolean>(true);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const userTypeFilterAtom = atom<string[]>([]);
export const statusFilterAtom = atom<string[]>([]);
export const subscriptionFilterAtom = atom<string[]>([]);
export const tableInstanceAtom = atom<any>(null);

// Current user detail view atom
export const currentUserAtom = atom<UserProfile | null>(null);

// Invite user dialog atom
export const inviteDialogOpenAtom = atom<boolean>(false);

// Delete confirmation dialog atom
export const deleteDialogOpenAtom = atom<boolean>(false);

// Selected users for deletion
export const selectedUsersAtom = atom<string[]>([]);
