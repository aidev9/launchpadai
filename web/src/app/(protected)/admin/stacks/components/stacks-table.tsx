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
  stacksAtom,
  rowSelectionAtom,
  columnFiltersAtom,
  sortingAtom,
  columnVisibilityAtom,
  selectedStacksAtom,
  currentStackAtom,
  searchFilterAtom,
  tableInstanceAtom,
} from "../stacks-store";
import { Stack } from "../../types/admin-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StacksTableToolbar } from "./stacks-table-toolbar";
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
import { MoreHorizontal, Eye, Pencil, Trash, Layers } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminStacks } from "@/lib/firebase/client/FirebaseAdminStacks";
import { isAdminAtom } from "@/lib/store/user-store";
import { useAction } from "next-safe-action/hooks";
import { deleteStack } from "../actions/delete";

// Create columns function that accepts the necessary handlers
const createColumns = (
  setCurrentStack: (stack: Stack) => void,
  router: any,
  handleDeleteStack: (stackId: string) => void
): ColumnDef<Stack>[] => [
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
  // Title column with enhanced display
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stack" />
    ),
    cell: ({ row }) => (
      <div className="flex items-start gap-3 min-w-0">
        <Layers className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm">
            {row.original.title || "Untitled Stack"}
          </div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {row.original.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={row.original.isPublic ? "default" : "outline"}
              className="text-xs"
            >
              {row.original.isPublic ? "Public" : "Private"}
            </Badge>
            {row.original.components && row.original.components.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {row.original.components.length} component
                {row.original.components.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>
    ),
    enableSorting: true,
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
      const stack = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()} // Prevent row click
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setCurrentStack(stack);
                router.push("/admin/stacks/stack");
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement edit functionality
                console.log("Edit stack:", stack.id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteStack(stack.id);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function StacksTable() {
  const [stacks, setStacks] = useAtom(stacksAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [selectedStacks, setSelectedStacks] = useAtom(selectedStacksAtom);
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const [, setCurrentStack] = useAtom(currentStackAtom);
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = useAtomValue(isAdminAtom);

  // Delete dialog state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Use React Firebase Hooks for real-time data
  const [firebaseStacks, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminStacks.getStacksCountQuery() : null
  );

  // Individual delete action
  const { execute: executeDeleteStack } = useAction(deleteStack, {
    onSuccess: (data) => {
      if (data.data?.success) {
        toast({
          title: "Success",
          description: data.data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.data?.error || "Failed to delete stack",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete stack",
        variant: "destructive",
      });
    },
  });

  // Handle individual stack deletion
  const handleDeleteStack = (stackId: string) => {
    executeDeleteStack({ stackId });
  };

  // Create columns with handlers
  const columns = createColumns(setCurrentStack, router, handleDeleteStack);

  // Transform and sort Firebase data
  useEffect(() => {
    if (firebaseStacks) {
      console.log("Raw Firebase stacks data:", firebaseStacks);

      const transformedStacks = firebaseStacks
        .map((stack: any) => {
          console.log("Processing stack:", stack);
          return {
            id: stack.id,
            userId: stack.userId || "unknown",
            title: stack.name || "Untitled Stack", // Map 'name' field to 'title' for consistency
            description: stack.description || "",
            isPublic: stack.isPublic || false,
            components: stack.components || [],
            views: Number(stack.views || 0),
            likes: Number(stack.likes || 0),
            createdAt: stack.createdAt || Date.now() / 1000,
            updatedAt: stack.updatedAt || Date.now() / 1000,
            tags: stack.tags || [],
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC

      console.log("Transformed stacks:", transformedStacks);
      setStacks(transformedStacks as Stack[]);
    }
  }, [firebaseStacks, setStacks]);

  // Handle Firebase errors
  useEffect(() => {
    if (error) {
      console.error("Failed to load stacks:", error);
      toast({
        title: "Error",
        description: "Failed to load stacks from database",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Update selectedStacks atom when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => stacks[parseInt(index)]?.id || "")
      .filter(Boolean);

    console.log("Row selection changed:", rowSelection);
    console.log("Selected IDs:", selectedIds);

    setSelectedStacks(selectedIds);
  }, [rowSelection, stacks, setSelectedStacks]);

  // Reset row selection when stacks data changes (e.g. after deletion)
  useEffect(() => {
    if (Object.keys(rowSelection).length > 0) {
      // Check if any selected rows no longer exist
      const validSelections = Object.keys(rowSelection)
        .filter((index) => parseInt(index) < stacks.length)
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
  }, [stacks, rowSelection, setRowSelection]);

  const table = useReactTable({
    data: stacks,
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
      <StacksTableToolbar table={table} />
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
                    // Navigate to stack detail page
                    const stack = row.original;
                    setCurrentStack(stack);
                    router.push("/admin/stacks/stack");
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
                  {loading ? "Loading stacks..." : "No stacks found."}
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
