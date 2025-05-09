"use client";

import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
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
  usersAtom,
  rowSelectionAtom,
  columnFiltersAtom,
  sortingAtom,
  columnVisibilityAtom,
  selectedUsersAtom,
  currentUserAtom,
  searchFilterAtom,
  tableInstanceAtom,
} from "../users-store";
import { UserProfile } from "@/lib/firebase/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAllUsers } from "../actions/users";
import { deleteUser } from "../actions/delete";
import { Badge } from "@/components/ui/badge";
import { UsersTableToolbar } from "./users-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
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

export const columns: ColumnDef<UserProfile>[] = [
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
  // Display Name column
  {
    accessorKey: "displayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.displayName || "N/A"}</div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Email column
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div>{row.original.email || "N/A"}</div>,
    enableSorting: true,
    enableColumnFilter: true,
  },
  // User Type column
  {
    accessorKey: "userType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User Type" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.userType || "user"}</Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Subscription column
  {
    accessorKey: "subscription",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subscription" />
    ),
    cell: ({ row }) => {
      // Handle subscription safely
      const subscription = row.original.subscription;
      let subscriptionValue = "free";
      let variant: "default" | "outline" | "secondary" | "destructive" =
        "outline";

      if (typeof subscription === "string") {
        subscriptionValue = subscription;
      } else if (subscription && typeof subscription === "object") {
        // Use type assertion to access properties safely
        const subObj = subscription as any;
        if (subObj.planType) {
          subscriptionValue = subObj.planType;
        }
      }

      // Check for inviteSubscription using type assertion
      const userData = row.original as any;
      if (userData.inviteSubscription) {
        subscriptionValue = userData.inviteSubscription;
      }

      switch (subscriptionValue) {
        case "enterprise":
          variant = "default";
          break;
        case "builder":
        case "explorer":
          variant = "secondary";
          break;
        default:
          variant = "outline";
      }

      return <Badge variant={variant}>{subscriptionValue}</Badge>;
    },
    filterFn: (row, id, value) => {
      // Simple filter that works with string values
      try {
        // Get the value safely
        const rawValue = row.getValue(id);
        let subscriptionValue = "free";

        if (typeof rawValue === "string") {
          subscriptionValue = rawValue;
        } else if (rawValue && typeof rawValue === "object") {
          const subObj = rawValue as any;
          if (subObj.planType) {
            subscriptionValue = subObj.planType;
          }
        }

        return value.includes(subscriptionValue.toLowerCase());
      } catch (e) {
        // If anything goes wrong, default to including the row
        return true;
      }
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  // XP column
  {
    accessorKey: "xp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="XP" />
    ),
    cell: ({ row }) => <div>{row.original.xp || 0}</div>,
    enableSorting: true,
  },
  // Level column
  {
    accessorKey: "level",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => <div>{row.original.level || 0}</div>,
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
  // Email Verified column
  {
    accessorKey: "isEmailVerified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Verified" />
    ),
    cell: ({ row }) => <div>{row.original.isEmailVerified ? "Yes" : "No"}</div>,
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id) ? "verified" : "unverified");
    },
  },
  // Actions column
  {
    id: "actions",
    cell: DataTableRowActions,
    meta: {
      className: "text-right",
    },
  },
];

export function UsersTable() {
  const [users, setUsers] = useAtom(usersAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [, setSelectedUsers] = useAtom(selectedUsersAtom);
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const router = useRouter();
  const { toast } = useToast();

  // Delete dialog state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Function to load users
  const loadUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Update selectedUsers atom when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => users[parseInt(index)]?.uid || "")
      .filter(Boolean);

    console.log("Row selection changed:", rowSelection);
    console.log("Selected IDs:", selectedIds);

    setSelectedUsers(selectedIds);
  }, [rowSelection, users, setSelectedUsers]);

  // Reset row selection when users data changes (e.g. after deletion)
  useEffect(() => {
    if (Object.keys(rowSelection).length > 0) {
      // Check if any selected rows no longer exist
      const validSelections = Object.keys(rowSelection)
        .filter((index) => parseInt(index) < users.length)
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
  }, [users, rowSelection, setRowSelection]);

  const table = useReactTable({
    data: users,
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
  });

  // Store the table instance in the atom for access from other components
  useEffect(() => {
    setTableInstance(table);
  }, [table, setTableInstance]);

  // Handle deleting selected users
  const handleDeleteSelected = async () => {
    setIsDeleting(true);

    try {
      let failedCount = 0;
      let successCount = 0;

      // Get selected user IDs
      const selectedUserIds = Object.keys(rowSelection).map(
        (index) => users[parseInt(index)].uid
      );

      // Delete users one by one
      for (const uid of selectedUserIds) {
        try {
          const result = await deleteUser(uid);
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
            console.error(`Failed to delete user ${uid}: ${result.error}`);
          }
        } catch (err) {
          failedCount++;
          console.error(`Error deleting user ${uid}:`, err);
        }
      }

      // Update UI based on results
      if (successCount > 0) {
        // Refresh users list
        const result = await getAllUsers();
        if (result.success) {
          setUsers(result.users || []);
        }

        // Clear row selection
        setRowSelection({});

        // Show success message
        toast({
          title: "Users deleted",
          duration: TOAST_DEFAULT_DURATION,
          description: `Successfully deleted ${successCount} ${
            successCount === 1 ? "user" : "users"
          }${
            failedCount > 0
              ? `. Failed to delete ${failedCount} ${
                  failedCount === 1 ? "user" : "users"
                }.`
              : ""
          }`,
        });
      } else {
        toast({
          title: "Error",
          duration: TOAST_DEFAULT_DURATION,
          description: "Failed to delete selected users.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while deleting users",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <UsersTableToolbar table={table} onRefresh={loadUsers} />
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
                    // Navigate to user detail page
                    const user = row.original;
                    setCurrentUser(user);
                    router.push("/admin/users/user");
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
                  No users found.
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
