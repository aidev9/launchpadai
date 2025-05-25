import { atom } from "jotai";

// Tab navigation state
export type AdminTab = 
  | "general" 
  | "users" 
  | "products" 
  | "prompts" 
  | "stacks" 
  | "collections" 
  | "agents";

export const activeAdminTabAtom = atom<AdminTab>("general");

// Refresh trigger for data fetching
export const adminRefreshTriggerAtom = atom<number>(0);

// Search and filter states
export const adminSearchQueryAtom = atom<string>("");
export const adminFilterStateAtom = atom<Record<string, any>>({});

// Pagination state
export const adminPaginationAtom = atom<{
  page: number;
  pageSize: number;
  totalItems: number;
}>({
  page: 1,
  pageSize: 10,
  totalItems: 0,
});

// Selected items for bulk actions
export const adminSelectedItemsAtom = atom<string[]>([]);
