import { atom } from "jotai";
import { Collection } from "../types/admin-types";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

// Define types for collection status and filters
export type CollectionStatus = "public" | "private";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "createdAt", desc: true },
]);
export const collectionsAtom = atom<Collection[]>([]);
export const isLoadingAtom = atom<boolean>(true);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const statusFilterAtom = atom<string[]>([]);
export const userIdFilterAtom = atom<string[]>([]);
export const tableInstanceAtom = atom<any>(null);

// Current collection detail view atom
export const currentCollectionAtom = atom<Collection | null>(null);

// Edit collection dialog atom
export const editDialogOpenAtom = atom<boolean>(false);

// Delete confirmation dialog atom
export const deleteDialogOpenAtom = atom<boolean>(false);

// Selected collections for deletion
export const selectedCollectionsAtom = atom<string[]>([]);

// Edited collection atom for form state
export const editedCollectionAtom = atom<Collection | null>(null);
