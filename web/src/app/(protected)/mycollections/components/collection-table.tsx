"use client";

import { useState } from "react";
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
import { Collection, CollectionStatus } from "@/lib/firebase/schema";
import { getColumns } from "@/app/(protected)/mycollections/components/collections-columns";
import { DataTablePagination } from "@/app/(protected)/myprompts/components/data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import {
  collectionColumnFiltersAtom,
  collectionColumnVisibilityAtom,
  collectionRowSelectionAtom,
  collectionSortingAtom,
  collectionTableInstanceAtom,
} from "@/lib/store/collection-store";
import { useEffect } from "react";

interface CollectionTableProps {
  data: Collection[];
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onTagClick?: (tag: string) => void;
  onStatusClick?: (status: CollectionStatus) => void;
  onClick?: (collection: Collection) => void;
}

export function CollectionTable({
  data,
  onEdit,
  onDelete,
  onTagClick,
  onStatusClick,
  onClick,
}: CollectionTableProps) {
  // Use Jotai atoms for table state
  const [sorting, setSorting] = useAtom(collectionSortingAtom);
  const [columnFilters, setColumnFilters] = useAtom(
    collectionColumnFiltersAtom
  );
  const [rowSelection, setRowSelection] = useAtom(collectionRowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(
    collectionColumnVisibilityAtom
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [, setTableInstance] = useAtom(collectionTableInstanceAtom);

  const columns = getColumns({
    onEdit,
    onDelete,
    onTagClick,
    onStatusClick,
  });

  const table = useReactTable({
    data,
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
    collection: Collection
  ) => {
    // Don't trigger on checkbox or actions column clicks (they have their own handlers)
    // Check if target is in these cells or their children
    const target = e.target as HTMLElement;
    const checkboxCell = target.closest('td[data-column="select"]');
    const actionsCell = target.closest('td[data-column="actions"]');

    // If clicked in checkbox or actions cell, don't navigate
    if (checkboxCell || actionsCell) {
      return;
    }

    // Otherwise, trigger the onClick handler
    onClick?.(collection);
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
                        header.id === "select" && "sticky left-0 z-10",
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
                  onClick={(e) => handleRowClick(e, row.original as Collection)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      data-column={cell.column.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        cell.column.id === "select" &&
                          "sticky left-0 bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
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
                  No collections found.
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
