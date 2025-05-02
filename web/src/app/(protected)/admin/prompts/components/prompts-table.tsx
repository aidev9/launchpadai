"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  promptActionAtom,
  promptRowSelectionAtom,
} from "@/lib/store/prompt-store";
import { deletePromptsAction } from "@/lib/firebase/actions/prompts";
import { useToast } from "@/hooks/use-toast";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function PromptsTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useAtom(promptRowSelectionAtom);
  const [isDeleting, setIsDeleting] = useState(false);
  const setPromptAction = useSetAtom(promptActionAtom);
  const { toast } = useToast();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleBatchDelete = async () => {
    // Get the selected row IDs
    const selectedRows = table.getSelectedRowModel().rows;
    const promptIds = selectedRows.map((row) => (row.original as any).id);

    if (promptIds.length === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${promptIds.length} prompts?`)
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      // Use the server action for batch deletion
      const result = await deletePromptsAction(promptIds);

      if (result.success) {
        // Update UI via Jotai
        setPromptAction({
          type: "DELETE_MANY",
          promptIds,
        });

        // Reset selection
        setRowSelection({});

        toast({
          title: "Prompts deleted",
          description: `Successfully deleted ${promptIds.length} prompts.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting prompts:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedRowsCount = table.getSelectedRowModel().rows.length;

  return (
    <div>
      {/* Filter and batch actions */}
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {selectedRowsCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete {selectedRowsCount}{" "}
            {selectedRowsCount === 1 ? "Prompt" : "Prompts"}
          </Button>
        )}
      </div>

      {/* Table */}
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
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
  );
}
