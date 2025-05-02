"use client";

import * as React from "react";
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
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import {
  promptRowSelectionAtom,
  columnVisibilityAtom,
  columnFiltersAtom,
  sortingAtom,
  tableInstanceAtom,
  titleFilterAtom,
  phaseTagsFilterAtom,
  productTagsFilterAtom,
  tagsFilterAtom,
} from "@/lib/store/prompt-store";
import { Prompt } from "@/lib/firebase/schema";

interface PromptTableProps {
  columns: ColumnDef<Prompt>[];
  data: Prompt[];
}

export function PromptTable({ columns, data }: PromptTableProps) {
  // Use Jotai atoms for table state
  const [rowSelection, setRowSelection] = useAtom(promptRowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);

  // Get filter atoms
  const [titleFilter] = useAtom(titleFilterAtom);
  const [phaseTagsFilter] = useAtom(phaseTagsFilterAtom);
  const [productTagsFilter] = useAtom(productTagsFilterAtom);
  const [tagsFilter] = useAtom(tagsFilterAtom);

  // Keep track of previous data length to detect when data changes
  const prevDataLength = React.useRef(data.length);

  // Clear row selection when data changes significantly
  // This prevents selection state from being out of sync with actual data
  React.useEffect(() => {
    // If data length has changed, it means prompts were added or deleted
    if (data.length !== prevDataLength.current) {
      console.log("Data changed, clearing row selection");
      setRowSelection({});
      prevDataLength.current = data.length;
    }
  }, [data.length, setRowSelection]);

  // Sync filter atoms with columnFilters when component mounts
  React.useEffect(() => {
    const newColumnFilters: ColumnFiltersState = [];

    if (titleFilter) {
      newColumnFilters.push({
        id: "title",
        value: titleFilter,
      });
    }

    if (phaseTagsFilter.length > 0) {
      newColumnFilters.push({
        id: "phaseTags",
        value: phaseTagsFilter,
      });
    }

    if (productTagsFilter.length > 0) {
      newColumnFilters.push({
        id: "productTags",
        value: productTagsFilter,
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
    titleFilter,
    phaseTagsFilter,
    productTagsFilter,
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

  // Store the table instance in the atom
  React.useEffect(() => {
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
                    className={cn(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none",
                      header.column.columnDef.meta?.className
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
