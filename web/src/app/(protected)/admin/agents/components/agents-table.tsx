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
  agentsAtom,
  rowSelectionAtom,
  columnFiltersAtom,
  sortingAtom,
  columnVisibilityAtom,
  selectedAgentsAtom,
  currentAgentAtom,
  searchFilterAtom,
  tableInstanceAtom,
} from "../agents-store";
import { Agent } from "../../types/admin-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AgentsTableToolbar } from "./agents-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableColumnHeader } from "./data-table-column-header";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash, Bot } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminAgents } from "@/lib/firebase/client/FirebaseAdminAgents";
import { isAdminAtom } from "@/lib/store/user-store";

export const columns: ColumnDef<Agent>[] = [
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
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="font-medium">
            {row.original.title || "Untitled Agent"}
          </div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
              {row.original.description}
            </div>
          )}
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
  // Capabilities column
  {
    accessorKey: "capabilities",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Capabilities" />
    ),
    cell: ({ row }) => {
      const capabilities = row.original.capabilities || [];
      return (
        <div className="flex items-center gap-1">
          <span className="font-medium">{capabilities.length}</span>
          {capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {capabilities.slice(0, 2).map((capability, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {typeof capability === "string" ? capability : "Capability"}
                </Badge>
              ))}
              {capabilities.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{capabilities.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  // Usage Count column
  {
    accessorKey: "usageCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usage" />
    ),
    cell: ({ row }) => <div>{row.original.usageCount || 0}</div>,
    enableSorting: true,
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
      const agent = row.original;

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

export function AgentsTable() {
  const [agents, setAgents] = useAtom(agentsAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [selectedAgents, setSelectedAgents] = useAtom(selectedAgentsAtom);
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const [, setCurrentAgent] = useAtom(currentAgentAtom);
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = useAtomValue(isAdminAtom);

  // Delete dialog state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Use React Firebase Hooks for real-time data
  const [firebaseAgents, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminAgents.getAgentsCountQuery() : null
  );

  // Transform and sort Firebase data
  useEffect(() => {
    if (firebaseAgents) {
      const transformedAgents = firebaseAgents
        .map((agent: any) => ({
          id: agent.id,
          userId: agent.userId || "unknown",
          title: agent.title || "Untitled Agent",
          description: agent.description || "",
          isPublic: agent.isPublic || false,
          capabilities: agent.capabilities || [],
          usageCount: Number(agent.usageCount || 0),
          views: Number(agent.views || 0),
          createdAt: agent.createdAt || Date.now() / 1000,
          updatedAt: agent.updatedAt || Date.now() / 1000,
          tags: agent.tags || [],
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC

      setAgents(transformedAgents as Agent[]);
    }
  }, [firebaseAgents, setAgents]);

  // Handle Firebase errors
  useEffect(() => {
    if (error) {
      console.error("Failed to load agents:", error);
      toast({
        title: "Error",
        description: "Failed to load agents from database",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Update selectedAgents atom when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => agents[parseInt(index)]?.id || "")
      .filter(Boolean);

    console.log("Row selection changed:", rowSelection);
    console.log("Selected IDs:", selectedIds);

    setSelectedAgents(selectedIds);
  }, [rowSelection, agents, setSelectedAgents]);

  // Reset row selection when agents data changes (e.g. after deletion)
  useEffect(() => {
    if (Object.keys(rowSelection).length > 0) {
      // Check if any selected rows no longer exist
      const validSelections = Object.keys(rowSelection)
        .filter((index) => parseInt(index) < agents.length)
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
  }, [agents, rowSelection, setRowSelection]);

  const table = useReactTable({
    data: agents,
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
      <AgentsTableToolbar table={table} />
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
                    // Navigate to agent detail page
                    const agent = row.original;
                    setCurrentAgent(agent);
                    // router.push("/admin/agents/agent");
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
                  {loading ? "Loading agents..." : "No agents found."}
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
