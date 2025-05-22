"use client";

import { useState, useMemo } from "react";
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
import { Product } from "@/lib/firebase/schema";
import { getColumns } from "./products-columns";
import { DataTablePagination } from "@/app/(protected)/myprompts/components/data-table-pagination";
import { ProductDataTablePagination } from "./product-data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import {
  productColumnFiltersAtom,
  productColumnVisibilityAtom,
  productRowSelectionAtom,
  productSortingAtom,
  productTableInstanceAtom,
} from "@/lib/store/product-store";

interface ProductTableProps {
  data: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPhaseClick?: (phase: string) => void;
  onClick?: (product: Product) => void;
}

export function ProductTable({
  data,
  onEdit,
  onDelete,
  onPhaseClick,
  onClick,
}: ProductTableProps) {
  // Use Jotai atoms for table state - each in its own atomic state
  const [rowSelection, setRowSelection] = useAtom(productRowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(
    productColumnVisibilityAtom
  );
  const [columnFilters, setColumnFilters] = useAtom(productColumnFiltersAtom);
  const [sorting, setSorting] = useAtom(productSortingAtom);
  const [, setTableInstance] = useAtom(productTableInstanceAtom);

  // Use local globalFilter instead of atom to avoid circular dependencies
  const [globalFilter, setGlobalFilter] = useState("");

  // Create columns - memoize to avoid unnecessary recreation
  const columns = useMemo(
    () =>
      getColumns({
        onEdit,
        onDelete,
        onPhaseClick,
        onClick,
      }),
    [onEdit, onDelete, onPhaseClick, onClick]
  );

  // Create table instance with complete config
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updatedSelection) => {
      setRowSelection(updatedSelection);
    },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Store table instance reference but don't cause renders on it
  // Run this only at initialization time using useState callback
  useState(() => {
    setTableInstance(table);
  });

  // Handle row click
  const handleRowClick = (
    e: React.MouseEvent<HTMLTableRowElement>,
    product: Product
  ) => {
    // Don't trigger on checkbox or actions column clicks (they have their own handlers)
    const target = e.target as HTMLElement;
    const checkboxCell = target.closest('td[data-column="select"]');
    const actionsCell = target.closest('td[data-column="actions"]');

    // If clicked in checkbox or actions cell, don't navigate
    if (checkboxCell || actionsCell) {
      return;
    }

    // Otherwise, trigger the onClick handler
    onClick?.(product);
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={`header-${headerGroup.id}`}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={`header-cell-${header.id}`}
                    className={cn(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none",
                      header.id === "select" && "sticky left-0 z-10",
                      (header.column.columnDef?.meta as any)?.align ===
                        "right" && "text-right",
                      "bg-background transition-colors whitespace-nowrap"
                    )}
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
                  key={`row-${row.id}`}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={(e) => handleRowClick(e, row.original as Product)}
                  data-testid={`product-row-${(row.original as Product).id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={`cell-${cell.id}`}
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
                  No products found.
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
