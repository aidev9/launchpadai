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
  rowSelectionAtom,
  columnVisibilityAtom,
  columnFiltersAtom,
  sortingAtom,
  tableInstanceAtom,
  statusFilterAtom,
  tagsFilterAtom,
  questionsPhaseFilterAtom,
  searchQueryAtom as questionsSearchQueryAtom,
} from "./qa-store";

type QAData = {
  id: string;
  tags?: string[]; // Make tags optional to match the Question type
  question: string;
  order?: number;
  answer?: string | null;
  phase?: string;
  createdAt?: number;
  updatedAt?: number;
};

interface QATableProps<TValue> {
  columns: ColumnDef<QAData, TValue>[];
  data: QAData[];
}

export function QATable<TValue>({ columns, data }: QATableProps<TValue>) {
  // Use Jotai atoms for table state
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);

  // Get filter atoms
  const [questionFilter] = useAtom(questionsSearchQueryAtom);
  const [statusFilter] = useAtom(statusFilterAtom);
  const [tagsFilter] = useAtom(tagsFilterAtom);
  const [phaseFilter] = useAtom(questionsPhaseFilterAtom);

  // Keep track of previous data length to detect when data changes
  const prevDataLength = React.useRef(data.length);

  // Clear row selection when data changes significantly
  // This prevents selection state from being out of sync with actual data
  React.useEffect(() => {
    // If data length has changed, it means questions were added or deleted
    if (data.length !== prevDataLength.current) {
      setRowSelection({});
      prevDataLength.current = data.length;
    }
  }, [data.length, setRowSelection]);

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

    if (phaseFilter.length > 0) {
      newColumnFilters.push({
        id: "phase",
        value: phaseFilter,
      });
    }

    if (JSON.stringify(newColumnFilters) !== JSON.stringify(columnFilters)) {
      setColumnFilters(newColumnFilters);
    }
  }, [
    questionFilter,
    statusFilter,
    tagsFilter,
    phaseFilter,
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
    // Use document IDs as unique row keys for proper selection
    getRowId: (row) => row.id,
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
    // Type assertion to resolve type mismatch between QAData and Question
    setTableInstance(table as any);
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
                      {
                        "cursor-pointer select-none":
                          header.column.getCanSort(),
                      },
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
