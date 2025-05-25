import { atom } from "jotai";
import { Prompt } from "../types/admin-types";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

// Define types for prompt status and filters
export type PromptStatus = "public" | "private";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "createdAt", desc: true },
]);
export const promptsAtom = atom<Prompt[]>([]);
export const isLoadingAtom = atom<boolean>(true);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const statusFilterAtom = atom<string[]>([]);
export const userIdFilterAtom = atom<string[]>([]);
export const tableInstanceAtom = atom<any>(null);

// Current prompt detail view atom
export const currentPromptAtom = atom<Prompt | null>(null);

// Edit prompt dialog atom
export const editDialogOpenAtom = atom<boolean>(false);

// Delete confirmation dialog atom
export const deleteDialogOpenAtom = atom<boolean>(false);

// Selected prompts for deletion
export const selectedPromptsAtom = atom<string[]>([]);

// Edited prompt atom for form state
export const editedPromptAtom = atom<Prompt | null>(null);
