"use client";

import { useEffect, useState } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
  promptsAtom,
  rowSelectionAtom,
  columnFiltersAtom,
  sortingAtom,
  columnVisibilityAtom,
  selectedPromptsAtom,
  currentPromptAtom,
  searchFilterAtom,
  tableInstanceAtom,
} from "../prompts-store";
import { Prompt } from "../../types/admin-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PromptsTableToolbar } from "./prompts-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableColumnHeader } from "./data-table-column-header";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminPrompts } from "@/lib/firebase/client/FirebaseAdminPrompts";
import { isAdminAtom } from "@/lib/store/user-store";

export const columns: ColumnDef<Prompt>[] = [
  // Selection column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Title column
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.title || "Untitled"}</div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Content column
  {
    accessorKey: "content",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Content" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-sm text-muted-foreground">
        {row.original.content || "No content"}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: true,
  },
  // User ID column
  {
    accessorKey: "userId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User ID" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.userId || "N/A"}</div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Status column (Public/Private)
  {
    accessorKey: "isPublic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.isPublic ? "default" : "outline"}>
        {row.original.isPublic ? "Public" : "Private"}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id) ? "public" : "private");
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Views column
  {
    accessorKey: "views",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Views" />
    ),
    cell: ({ row }) => <div>{row.original.views || 0}</div>,
    enableSorting: true,
  },
  // Likes column
  {
    accessorKey: "likes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Likes" />
    ),
    cell: ({ row }) => <div>{row.original.likes || 0}</div>,
    enableSorting: true,
  },
  // Created At column
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      // Firebase timestamps are stored as seconds, convert to milliseconds
      const timestamp = row.original.createdAt;
      let date = null;

      if (timestamp) {
        // Convert timestamp to number if it's a string
        const timestampNum =
          typeof timestamp === "string"
            ? parseInt(timestamp, 10)
            : Number(timestamp);

        // Check if timestamp needs to be multiplied by 1000 (seconds to ms)
        if (!isNaN(timestampNum)) {
          const isSeconds = timestampNum < 10000000000; // If timestamp is in seconds, it will be much smaller
          date = new Date(isSeconds ? timestampNum * 1000 : timestampNum);
        }
      }

      return (
        <div>
          {date && !isNaN(date.getTime())
            ? new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(date)
            : "N/A"}
        </div>
      );
    },
    enableSorting: true,
  },
  // Actions column
  {
    id: "actions",
    cell: ({ row }) => {
      const prompt = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function PromptsTable() {
  const [prompts, setPrompts] = useAtom(promptsAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [selectedPrompts, setSelectedPrompts] = useAtom(selectedPromptsAtom);
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const [, setCurrentPrompt] = useAtom(currentPromptAtom);
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = useAtomValue(isAdminAtom);

  // Delete dialog state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Use React Firebase Hooks for real-time data
  const [firebasePrompts, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminPrompts.getPromptsCountQuery() : null
  );

  // Transform and sort Firebase data
  useEffect(() => {
    if (firebasePrompts) {
      const transformedPrompts = firebasePrompts
        .map((prompt: any) => ({
          id: prompt.id,
          userId: prompt.userId || "unknown",
          title: prompt.title || "Untitled Prompt",
          content: prompt.body || prompt.content || "",
          isPublic: prompt.isPublic || false,
          views: Number(prompt.views || 0),
          likes: Number(prompt.likes || 0),
          createdAt: prompt.createdAt || Date.now() / 1000,
          updatedAt: prompt.updatedAt || Date.now() / 1000,
          tags: [
            ...(prompt.phaseTags || []),
            ...(prompt.productTags || []),
            ...(prompt.tags || []),
          ],
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC

      setPrompts(transformedPrompts as Prompt[]);
    }
  }, [firebasePrompts, setPrompts]);

  // Handle Firebase errors
  useEffect(() => {
    if (error) {
      console.error("Failed to load prompts:", error);
      toast({
        title: "Error",
        description: "Failed to load prompts from database",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Update selectedPrompts atom when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => prompts[parseInt(index)]?.id || "")
      .filter(Boolean);

    console.log("Row selection changed:", rowSelection);
    console.log("Selected IDs:", selectedIds);

    setSelectedPrompts(selectedIds);
  }, [rowSelection, prompts, setSelectedPrompts]);

  // Reset row selection when prompts data changes (e.g. after deletion)
  useEffect(() => {
    if (Object.keys(rowSelection).length > 0) {
      // Check if any selected rows no longer exist
      const validSelections = Object.keys(rowSelection)
        .filter((index) => parseInt(index) < prompts.length)
        .reduce(
          (acc, key) => {
            acc[key] = rowSelection[key];
            return acc;
          },
          {} as Record<string, boolean>
        );

      // If some selections are no longer valid, update row selection
      if (
        Object.keys(validSelections).length !== Object.keys(rowSelection).length
      ) {
        setRowSelection(validSelections);
      }
    }
  }, [prompts, rowSelection, setRowSelection]);

  const table = useReactTable({
    data: prompts,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter: searchFilter || "",
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setSearchFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      sorting: [{ id: "createdAt", desc: true }], // Default sort by createdAt DESC
    },
  });

  // Store the table instance in the atom for access from other components
  useEffect(() => {
    setTableInstance(table);
  }, [table, setTableInstance]);

  return (
    <div className="space-y-4">
      <PromptsTableToolbar table={table} />
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
                  className="group/row cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => {
                    // Navigate to prompt detail page
                    const prompt = row.original;
                    setCurrentPrompt(prompt);
                    // router.push("/admin/prompts/prompt");
                  }}
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
                  {loading ? "Loading prompts..." : "No prompts found."}
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
