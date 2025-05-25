import { atom } from "jotai";
import { Stack } from "../types/admin-types";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

// Define types for stack status and filters
export type StackStatus = "public" | "private";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "createdAt", desc: true },
]);
export const stacksAtom = atom<Stack[]>([]);
export const isLoadingAtom = atom<boolean>(true);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const statusFilterAtom = atom<string[]>([]);
export const userIdFilterAtom = atom<string[]>([]);
export const tableInstanceAtom = atom<any>(null);

// Current stack detail view atom
export const currentStackAtom = atom<Stack | null>(null);

// Edit stack dialog atom
export const editDialogOpenAtom = atom<boolean>(false);

// Delete confirmation dialog atom
export const deleteDialogOpenAtom = atom<boolean>(false);

// Selected stacks for deletion
export const selectedStacksAtom = atom<string[]>([]);

// Edited stack atom for form state
export const editedStackAtom = atom<Stack | null>(null);
