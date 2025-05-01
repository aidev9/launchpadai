"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAtom, useSetAtom } from "jotai";
import { Course } from "@/lib/firebase/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  columnFiltersAtom,
  columnVisibilityAtom,
  rowSelectionAtom,
  searchFilterAtom,
  sortingAtom,
  tableInstanceAtom,
  levelFilterAtom,
  tagsFilterAtom,
  selectedCourseAtom,
} from "./courses-store";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

interface CoursesTableProps {
  columns: ColumnDef<Course>[];
  data: Course[];
}

export function CoursesTable({ columns, data }: CoursesTableProps) {
  // Initialize router for navigation
  const router = useRouter();

  // Add setSelectedCourse at component level
  const setSelectedCourse = useSetAtom(selectedCourseAtom);

  // Use Jotai atoms for table state
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);

  // Get filter atoms
  const [searchFilter] = useAtom(searchFilterAtom);
  const [levelFilter] = useAtom(levelFilterAtom);
  const [tagsFilter] = useAtom(tagsFilterAtom);

  // Keep track of previous data length to detect when data changes
  const prevDataLength = React.useRef(data.length);

  // Clear row selection when data changes significantly
  useEffect(() => {
    // If data length has changed, it means courses were added or deleted
    if (data.length !== prevDataLength.current) {
      setRowSelection({});
      prevDataLength.current = data.length;
    }
  }, [data.length, setRowSelection]);

  // Sync filter atoms with columnFilters when component mounts or filters change
  useEffect(() => {
    const newColumnFilters: ColumnFiltersState = [];

    if (searchFilter) {
      newColumnFilters.push({
        id: "title",
        value: searchFilter,
      });
    }

    if (levelFilter.length > 0) {
      newColumnFilters.push({
        id: "level",
        value: levelFilter,
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
  }, [searchFilter, levelFilter, tagsFilter, setColumnFilters, columnFilters]);

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

  // Store the table instance in the atom for access from other components
  useEffect(() => {
    setTableInstance(table);
  }, [table, setTableInstance]);

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
                    className={header.column.columnDef.meta?.className}
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
                  className="group/row cursor-pointer transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className}
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
                  No courses found.
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
