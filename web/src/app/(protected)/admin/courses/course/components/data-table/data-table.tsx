"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { addModuleModalOpenAtom } from "../modules-store";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onEdit,
  onDelete,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [, setAddModuleModalOpen] = useAtom(addModuleModalOpenAtom);

  // Add event handlers for edit and delete actions
  const handleTableClick = React.useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const actionButton = target.closest("[data-action]");

      if (!actionButton) return;

      const moduleId = actionButton.getAttribute("data-module-id");
      const action = actionButton.getAttribute("data-action");

      if (!moduleId) return;

      const row = data.find((item: any) => item.id === moduleId);
      if (!row) return;

      if (action === "edit" && onEdit) {
        e.stopPropagation();
        onEdit(row);
      } else if (action === "delete" && onDelete) {
        e.stopPropagation();
        onDelete(row);
      }
    },
    [data, onEdit, onDelete]
  );

  const handleAddModule = () => {
    setAddModuleModalOpen(true);
  };

  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    state: {
      sorting,
      rowSelection,
      columnFilters,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter modules..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Input
            placeholder="Filter by tags..."
            value={(table.getColumn("tags")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("tags")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
          <Button size="sm" onClick={handleAddModule}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table onClick={handleTableClick}>
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
                  No modules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Simple pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
