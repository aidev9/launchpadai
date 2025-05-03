"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { useAtom, useSetAtom } from "jotai";
import { Module } from "@/lib/firebase/schema";
import { deleteModule } from "@/lib/firebase/courses";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  columnFiltersAtom,
  columnVisibilityAtom,
  rowSelectionAtom,
  searchFilterAtom,
  sortingAtom,
  tableInstanceAtom,
  tagsFilterAtom,
  addModuleModalOpenAtom,
  moduleActionAtom,
} from "./modules-store";
import { DataTableToolbar } from "./data-table/data-table-toolbar";
import { DataTablePagination } from "./data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface ModulesTableProps {
  columns: ColumnDef<Module>[];
  data: Module[];
  courseId: string;
}

export function ModulesTable({ columns, data, courseId }: ModulesTableProps) {
  // Use Jotai atoms for table state
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const [searchFilter] = useAtom(searchFilterAtom);
  const [tagsFilter] = useAtom(tagsFilterAtom);
  const setAddModuleModalOpen = useSetAtom(addModuleModalOpenAtom);
  const setModuleAction = useSetAtom(moduleActionAtom);
  const { toast } = useToast();

  // Keep track of previous data length to detect when data changes
  const prevDataLength = React.useRef(data.length);

  // Clear row selection when data changes significantly
  useEffect(() => {
    // If data length has changed, it means modules were added or deleted
    if (data.length !== prevDataLength.current) {
      setRowSelection({});
      prevDataLength.current = data.length;
    }
  }, [data.length, setRowSelection]);

  // Sync filter atoms with columnFilters when component mounts or filters change
  useEffect(() => {
    const newColumnFilters: ColumnFiltersState = [];

    if (searchFilter) {
      newColumnFilters.push({
        id: "title",
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

  const handleAddModule = useCallback(() => {
    setAddModuleModalOpen(true);
  }, [setAddModuleModalOpen]);

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

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const initiateDelete = useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const moduleIds = selectedRows.map((row) => (row.original as Module).id);

    if (moduleIds.length === 0) return;

    setSelectedModuleIds(moduleIds);
    setShowDeleteDialog(true);
  }, [table]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedModuleIds.length === 0) return;

    try {
      setIsDeleting(true);

      // Delete each selected module
      const results = await Promise.all(
        selectedModuleIds.map(async (moduleId) => {
          const result = await deleteModule(courseId, moduleId);
          return { moduleId, success: result.success, error: result.error };
        })
      );

      // Count successes and failures
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      // Update state via module action
      if (successCount > 0) {
        setModuleAction({
          type: "DELETE_MANY",
          moduleIds: results.filter((r) => r.success).map((r) => r.moduleId),
        });
      }

      // Show toast with results
      if (successCount > 0 && failureCount === 0) {
        toast({
          title: "Success",
          duration: TOAST_DEFAULT_DURATION,
          description: `Successfully deleted ${successCount} module(s).`,
        });
      } else if (successCount > 0 && failureCount > 0) {
        toast({
          title: "Partial Success",
          duration: TOAST_DEFAULT_DURATION,
          description: `Deleted ${successCount} module(s), but failed to delete ${failureCount} module(s).`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          duration: TOAST_DEFAULT_DURATION,
          description: "Failed to delete selected modules.",
          variant: "destructive",
        });
      }

      // Clear selection
      setRowSelection({});
    } catch (error) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSelectedModuleIds([]);
    }
  }, [selectedModuleIds, toast, courseId, setModuleAction, setRowSelection]);

  // Store the table instance in the atom for access from other components
  useEffect(() => {
    setTableInstance(table);
  }, [table, setTableInstance]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Modules</h2>
        <div className="flex space-x-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="outline" size="sm" onClick={initiateDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
          <Button size="sm" onClick={handleAddModule}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </div>

      <DataTableToolbar table={table} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.columnDef.meta?.className as string
                    }
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
                      className={
                        cell.column.columnDef.meta?.className as string
                      }
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
                  No modules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              {selectedModuleIds.length === 1
                ? " the selected module"
                : ` ${selectedModuleIds.length} selected modules`}
              and all their content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
