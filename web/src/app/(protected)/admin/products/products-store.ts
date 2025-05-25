import { atom } from "jotai";
import { Table } from "@tanstack/react-table";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

// Product interface for admin usage
export interface AdminProduct {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  isPublic: boolean;
  phases: string[];
  website: string;
  country: string;
  views?: number;
  likes?: number;
  tags?: string[];
}

// Products data atom
export const productsAtom = atom<AdminProduct[]>([]);

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "createdAt", desc: true }, // Default sort by createdAt DESC
]);
export const columnVisibilityAtom = atom<VisibilityState>({});

// Filter-specific atoms
export const searchFilterAtom = atom<string>("");
export const phaseFilterAtom = atom<string[]>([]);
export const statusFilterAtom = atom<string[]>([]);
export const countryFilterAtom = atom<string[]>([]);

// Selected products atom
export const selectedProductsAtom = atom<string[]>([]);

// Current product atom (for detail view)
export const currentProductAtom = atom<AdminProduct | null>(null);

// Table instance atom (for accessing table methods from other components)
export const tableInstanceAtom = atom<Table<AdminProduct> | null>(null);
