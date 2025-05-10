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
import { Feature } from "@/lib/firebase/schema";
import { getFeatureColumns } from "./columns";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { useAtom } from "jotai";
import {
  featureTableColumnVisibilityAtom,
  featureTableSortingAtom,
  featureTableRowSelectionAtom,
} from "@/lib/store/feature-store";

interface FeatureDataTableProps {
  data: Feature[];
  onViewFeature: (feature: Feature) => void;
  onEditFeature: (feature: Feature) => void;
  onDeleteFeature: (feature: Feature) => void;
}

export function FeatureDataTable({
  data,
  onViewFeature,
  onEditFeature,
  onDeleteFeature,
}: FeatureDataTableProps) {
  const [sorting, setSorting] = useAtom(featureTableSortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(
    featureTableColumnVisibilityAtom
  );
  const [rowSelection, setRowSelection] = useAtom(featureTableRowSelectionAtom);
  const [globalFilter, setGlobalFilter] = useState("");

  // Memoize columns to prevent re-creation on every render
  const columns = useMemo(() => getFeatureColumns(), []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10, // Default page size
      },
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      onViewFeature,
      onEditFeature,
      onDeleteFeature,
    },
  });

  useEffect(() => {
    // If there are any persisted column visibility settings, apply them.
    table.setColumnVisibility(columnVisibility);
  }, [table, columnVisibility]);

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
                  No features found.
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
