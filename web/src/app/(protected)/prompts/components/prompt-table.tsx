"use client";

import { useState, useEffect } from "react";
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
import { Prompt } from "@/lib/firebase/schema";
import { getColumns } from "./columns";
import { DataTablePagination } from "./pagination";
import { DataTableToolbar } from "./toolbar";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import {
  columnFiltersAtom,
  columnVisibilityAtom,
  promptRowSelectionAtom,
  sortingAtom,
  tableInstanceAtom,
} from "@/lib/store/prompt-store";

interface PromptTableProps {
  prompts: Prompt[];
  onClick?: (prompt: Prompt) => void;
  onUseAsTemplate?: (prompt: Prompt) => void;
}

export function PromptTable({
  prompts,
  onClick,
  onUseAsTemplate,
}: PromptTableProps) {
  // Use Jotai atoms for table state
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [rowSelection, setRowSelection] = useAtom(promptRowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [globalFilter, setGlobalFilter] = useState("");
  const [, setTableInstance] = useAtom(tableInstanceAtom);

  const columns = getColumns({
    onUseAsTemplate,
  });

  const table = useReactTable({
    data: prompts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Save the table instance for external access
  useEffect(() => {
    setTableInstance(table);
  }, [table, setTableInstance]);

  // Handle row click
  const handleRowClick = (
    e: React.MouseEvent<HTMLTableRowElement>,
    prompt: Prompt
  ) => {
    // Don't trigger on actions column clicks (they have their own handlers)
    // Check if target is in these cells or their children
    const target = e.target as HTMLElement;
    const actionsCell = target.closest('td[data-column="actions"]');

    // If clicked in actions cell, don't navigate
    if (actionsCell) {
      return;
    }

    // Otherwise, trigger the onClick handler
    onClick?.(prompt);
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.getCanSort() &&
                          "cursor-pointer select-none",
                        (header.column.columnDef?.meta as any)?.align ===
                          "right" && "text-right",
                        "bg-background transition-colors"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row cursor-pointer"
                  onClick={(e) => handleRowClick(e, row.original as Prompt)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      data-column={cell.column.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        (cell.column.columnDef?.meta as any)?.align ===
                          "right" && "text-right"
                      )}
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
                  No prompts found.
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
