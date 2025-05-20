"use client";

import { useState, useEffect, MouseEvent } from "react";
import { useRouter } from "next/navigation";
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
import { Document, DocumentStatus } from "@/lib/firebase/schema";
import { getColumns } from "./documents-columns";
import { DataTablePagination } from "@/app/(protected)/myprompts/components/data-table-pagination";
import { DataTableToolbar } from "./document-table-toolbar";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { selectedDocumentAtom } from "@/lib/store/collection-store";
import {
  documentColumnFiltersAtom,
  documentColumnVisibilityAtom,
  documentRowSelectionAtom,
  documentSortingAtom,
  documentTableInstanceAtom,
} from "@/lib/store/collection-store";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteMultipleDocumentsAction } from "@/app/(protected)/mycollections/actions";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

interface DocumentTableProps {
  data: Document[];
  onDelete?: (document: Document) => void;
  onStatusUpdate?: (document: Document, status: DocumentStatus) => void;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
}

export function DocumentTable({
  data,
  onDelete,
  onStatusUpdate,
  onView,
  onEdit,
}: DocumentTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [, setSelectedDocument] = useAtom(selectedDocumentAtom);
  // Use Jotai atoms for table state
  const [sorting, setSorting] = useAtom(documentSortingAtom);
  const [columnFilters, setColumnFilters] = useAtom(documentColumnFiltersAtom);
  const [rowSelection, setRowSelection] = useAtom(documentRowSelectionAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(
    documentColumnVisibilityAtom
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [, setTableInstance] = useAtom(documentTableInstanceAtom);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = getColumns({
    onDelete,
    onStatusUpdate,
    onView,
    onEdit,
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

  // Handle row click to view document
  const handleRowClick = (
    e: MouseEvent<HTMLTableRowElement>,
    document: Document
  ) => {
    // Don't navigate if clicking on a button or action cell
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('[data-column="actions"]')
    ) {
      return;
    }

    // Set the selected document and navigate to the document view page
    setSelectedDocument(document);

    // Add a small delay to ensure the atom is updated before navigation
    setTimeout(() => {
      router.push("/mycollections/document");
    }, 10);
  };

  // Handle deleting selected documents
  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion of selected documents
  const confirmDeleteSelected = async () => {
    try {
      setIsSubmitting(true);

      // Get selected document IDs
      const selectedDocIds = Object.keys(rowSelection).map(
        (index) => data[parseInt(index)].id
      );

      if (selectedDocIds.length === 0) {
        setIsDeleteDialogOpen(false);
        return;
      }

      // Call the delete action
      const result = await deleteMultipleDocumentsAction(selectedDocIds);

      if (result.success) {
        toast({
          title: "Success",
          description: `${result.deletedCount} documents deleted successfully`,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Clear selection
        setRowSelection({});
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete documents",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} onDeleteSelected={handleDeleteSelected} />
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
                  className="group/row cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(e, row.original as Document)}
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
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {/* Confirmation dialog for deleting multiple documents */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Selected Documents"
        desc="Are you sure you want to delete the selected documents? This action cannot be undone."
        confirmText="Delete"
        cancelBtnText="Cancel"
        handleConfirm={confirmDeleteSelected}
        isLoading={isSubmitting}
        destructive={true}
      />
    </div>
  );
}
