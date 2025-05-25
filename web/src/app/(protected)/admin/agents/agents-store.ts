import { atom } from "jotai";
import { Agent } from "../types/admin-types";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

// Define types for agent status and filters
export type AgentStatus = "public" | "private";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "createdAt", desc: true },
]);
export const agentsAtom = atom<Agent[]>([]);
export const isLoadingAtom = atom<boolean>(true);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const statusFilterAtom = atom<string[]>([]);
export const userIdFilterAtom = atom<string[]>([]);
export const tableInstanceAtom = atom<any>(null);

// Current agent detail view atom
export const currentAgentAtom = atom<Agent | null>(null);

// Edit agent dialog atom
export const editDialogOpenAtom = atom<boolean>(false);

// Delete confirmation dialog atom
export const deleteDialogOpenAtom = atom<boolean>(false);

// Selected agents for deletion
export const selectedAgentsAtom = atom<string[]>([]);

// Edited agent atom for form state
export const editedAgentAtom = atom<Agent | null>(null);
