"use client";

import { useState, useEffect, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TechStack } from "@/lib/firebase/schema";
import { getStackColumns } from "./columns"; // Ensure this path is correct
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { useAtom } from "jotai";
import {
  stackTableColumnVisibilityAtom,
  stackTableSortingAtom,
  stackTableRowSelectionAtom, // Use this atom for row selection
} from "@/lib/store/techstack-store";

interface StackDataTableProps {
  data: TechStack[];
  onViewStack: (stack: TechStack) => void;
  onEditStack: (stack: TechStack) => void;
  onDeleteStack: (stack: TechStack) => void;
  // Global search query is handled outside, table will just display filtered data
  // Phase filter is also handled outside
}

export function StackDataTable({
  data,
  onViewStack,
  onEditStack,
  onDeleteStack,
}: StackDataTableProps) {
  const [sorting, setSorting] = useAtom(stackTableSortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(
    stackTableColumnVisibilityAtom
  );
  const [rowSelection, setRowSelection] = useAtom(stackTableRowSelectionAtom); // Use Jotai atom
  const [globalFilter, setGlobalFilter] = useState(""); // Add state for global filter

  // Memoize columns to prevent re-creation on every render, passing action handlers
  const columns = useMemo(
    () => getStackColumns(),
    [] // Pass handlers if they are props to getStackColumns, e.g. [onViewStack, onEditStack, onDeleteStack]
    // For now, assuming DataTableRowActions in columns.tsx will get these via context or another way if needed directly there
    // OR, we modify getStackColumns to accept these handlers and pass them to DataTableRowActions
  );

  // Re-evaluate: We need to pass handlers to the columns for the actions menu.
  // The getStackColumns should accept these so it can configure DataTableRowActions correctly.
  // Let's assume getStackColumns is modified to accept these, or we pass them to DataTableRowActions directly if it's a direct child.
  // For now, the `columns.tsx` was written to have DataTableRowActions take `row.original` and expect handlers to be available.
  // This implies that the `DataTableRowActions` component itself will need the handlers passed to it when it's rendered by the table.
  // This is usually done by passing them to the top-level table component and then through.

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter, // Pass global filter state
    },
    initialState: {
      pagination: {
        pageSize: 10, // Default page size
      },
      // Apply initial column visibility from atom if needed, though TanStack table updates it via onColumnVisibilityChange
      // columnVisibility: columnVisibility, // This might be redundant if atom is source of truth and updates table
    },
    enableRowSelection: true, // Enable row selection
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter, // Set state on change
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Global filtering is done on `data` prop before passing to table
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      onViewStack, // Pass handlers via meta to be accessible in cell renderers if needed
      onEditStack,
      onDeleteStack,
    },
  });

  useEffect(() => {
    // If there are any persisted column visibility settings, apply them.
    // This ensures that on initial load, if the atom has values, they are reflected.
    // This is a common pattern if the atom is the source of truth for initial state.
    table.setColumnVisibility(columnVisibility);
  }, [table, columnVisibility]); // Add missing dependencies

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  // onClick={() => onViewStack(row.original)} // Row click for view, if desired in addition to menu
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  No tech stacks found.
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
