"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { atom, useAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Question } from "../data/schema";
import { DataTablePagination } from "./data-table-pagination";
import {
  DataTableToolbar,
  questionFilterAtom,
  statusFilterAtom,
  tagsFilterAtom,
} from "./data-table-toolbar";

// Create atoms for table state
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([
  { id: "last_modified", desc: true },
]);

interface QuestionsTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function QuestionsTable<TData, TValue>({
  columns,
  data,
}: QuestionsTableProps<TData, TValue>) {
  // Use Jotai atoms for table state
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);

  // Get filter atoms
  const [questionFilter] = useAtom(questionFilterAtom);
  const [statusFilter] = useAtom(statusFilterAtom);
  const [tagsFilter] = useAtom(tagsFilterAtom);

  // Sync filter atoms with columnFilters when component mounts
  React.useEffect(() => {
    const newColumnFilters: ColumnFiltersState = [];

    if (questionFilter) {
      newColumnFilters.push({
        id: "question",
        value: questionFilter,
      });
    }

    if (statusFilter.length > 0) {
      newColumnFilters.push({
        id: "status",
        value: statusFilter,
      });
    }

    if (tagsFilter.length > 0) {
      newColumnFilters.push({
        id: "tags",
        value: tagsFilter,
      });
    }

    if (JSON.stringify(newColumnFilters) !== JSON.stringify(columnFilters)) {
      setColumnFilters(newColumnFilters);
    }
  }, [
    questionFilter,
    statusFilter,
    tagsFilter,
    setColumnFilters,
    columnFilters,
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none",
                      header.column.columnDef.meta?.className
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No questions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
