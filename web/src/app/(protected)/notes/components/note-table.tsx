"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  OnChangeFn,
  RowSelectionState,
  TableOptions,
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
  Note,
  rowSelectionAtom,
  columnVisibilityAtom,
  columnFiltersAtom,
  sortingAtom,
  tableInstanceAtom,
  searchFilterAtom,
  tagsFilterAtom,
} from "./notes-store";
import { columns } from "./notes-columns";

interface NoteTableProps {
  data: Note[];
  setSelectedRows: (ids: string[]) => void;
}

export function NoteTable({ data, setSelectedRows }: NoteTableProps) {
  // Use Jotai atoms for table state
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const [searchFilter] = useAtom(searchFilterAtom);
  const [tagsFilter] = useAtom(tagsFilterAtom);

  // Keep track of previous data length to detect when data changes
  const prevDataLength = React.useRef(data.length);

  // Keep track of previous selected rows to prevent unnecessary updates
  const prevSelectedRowsRef = React.useRef<string[]>([]);

  // Memoize the table data to prevent unnecessary re-renders
  const memoizedData = React.useMemo(() => data, [data]);

  // Synchronize rowSelection and selectedRows
  React.useEffect(() => {
    // Get selected row IDs from rowSelection that actually exist in the data
    const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id] && data.some((note) => note.id === id)
    );

    // Only update if the selection has actually changed
    if (
      JSON.stringify(selectedIds) !==
      JSON.stringify(prevSelectedRowsRef.current)
    ) {
      prevSelectedRowsRef.current = selectedIds;
      setSelectedRows(selectedIds);
    }
  }, [rowSelection, data, setSelectedRows]);

  // Initialize selection when component mounts or when data changes
  React.useEffect(() => {
    // Reset selection when data changes significantly
    if (data.length !== prevDataLength.current) {
      setRowSelection({});
      setSelectedRows([]);
      prevDataLength.current = data.length;
    }
  }, [data.length, setRowSelection, setSelectedRows]);

  // Sync filter atoms with columnFilters when component mounts
  React.useEffect(() => {
    const newColumnFilters = [];

    if (searchFilter) {
      newColumnFilters.push({
        id: "note_body",
        value: searchFilter,
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
  }, [searchFilter, tagsFilter, setColumnFilters, columnFilters]);

  // Manual handling of row selection changes
  const handleRowSelectionChange = React.useCallback<
    OnChangeFn<RowSelectionState>
  >(
    (updaterOrValue) => {
      const newRowSelection =
        typeof updaterOrValue === "function"
          ? updaterOrValue(rowSelection)
          : updaterOrValue;

      setRowSelection(newRowSelection);
    },
    [setRowSelection, rowSelection]
  );

  // Memoize table options to prevent unnecessary re-renders
  const tableOptions = React.useMemo<TableOptions<Note>>(
    () => ({
      data: memoizedData,
      columns,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        columnFilters,
      },
      enableRowSelection: true,
      onRowSelectionChange: handleRowSelectionChange,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues(),
      getRowId: (row: Note) => row.id,
    }),
    [
      memoizedData,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      handleRowSelectionChange,
      setSorting,
      setColumnFilters,
      setColumnVisibility,
    ]
  );

  const table = useReactTable<Note>(tableOptions);

  // Store the table instance in the atom
  React.useEffect(() => {
    setTableInstance(table);
  }, [table, setTableInstance]);

  // Memoize the rendering of table rows to prevent unnecessary re-renders
  const renderTableRows = React.useCallback(() => {
    if (!table.getRowModel().rows?.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            No notes found.
          </TableCell>
        </TableRow>
      );
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && "selected"}
        className="group/row"
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            className={cn(cell.column.columnDef.meta?.className as string)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [table]);

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
                      header.column.columnDef.meta?.className as string
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
          <TableBody>{renderTableRows()}</TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
