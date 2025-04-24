import { Table } from "@tanstack/react-table";
import { atom } from "jotai";

// Declare the DataTablePagination component
declare module "./data-table-pagination" {
  export interface DataTablePaginationProps<TData> {
    table: Table<TData>;
  }

  export function DataTablePagination<TData>(
    props: DataTablePaginationProps<TData>
  ): JSX.Element;
}

// Declare the DataTableToolbar component and its atoms
declare module "./data-table-toolbar" {
  export const questionFilterAtom: ReturnType<typeof atom<string>>;
  export const statusFilterAtom: ReturnType<typeof atom<string[]>>;
  export const tagsFilterAtom: ReturnType<typeof atom<string[]>>;
  export const phaseFilterAtom: ReturnType<typeof atom<string[]>>;

  export interface DataTableToolbarProps<TData> {
    table: Table<TData>;
  }

  export function DataTableToolbar<TData>(
    props: DataTableToolbarProps<TData>
  ): JSX.Element;
}
