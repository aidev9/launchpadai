# Implementation Plan for /admin/users Route

## Overview

We need to create a new `/admin/users` route that will display and manage users from the Firebase `/users` collection. This route will include features for viewing, filtering, and managing users, as well as a detailed user view and invitation functionality.

## Requirements

1. **User Table**

   - Display users from Firebase `/users` collection
   - Include all fields from the UserProfile schema
   - Implement sorting, filtering, and pagination
   - Enable row selection for bulk actions

2. **User Management**

   - Delete functionality (single and bulk)
   - Invite user feature with name, email, and subscription level
   - Generate invitation URL for new users

3. **User Detail View**
   - Display detailed user information
   - Show subscription level, products, prompts, and stacks
   - Include admin actions such as Send Email

## Implementation Plan

### Phase 1: Setup Basic Structure

1. **Create route and basic components**

   - Create `/admin/users` route
   - Set up basic page structure
   - Create Jotai store for state management

2. **Set up Firebase integration**
   - Create functions to fetch users from Firebase
   - Implement user deletion functionality
   - Create invite user functionality

### Phase 2: Implement User Table

1. **Create table component**

   - Implement table with columns for all UserProfile fields
   - Add sorting and pagination
   - Implement row selection

2. **Add filtering functionality**

   - Create filter components for search, user type, and subscription
   - Implement filter logic
   - Add filter facets to table headers

3. **Implement Delete Selected button**
   - Show button when rows are selected
   - Implement confirmation dialog
   - Handle deletion with proper error handling

### Phase 3: Create User Detail View

1. **Create user detail page**

   - Set up route at `/admin/users/user`
   - Create basic layout with user information
   - Add breadcrumbs for navigation

2. **Implement data fetching**

   - Create functions to fetch user-related data from Firebase
   - Fetch subscription, products, prompts, and stacks data
   - Handle loading and error states

3. **Create detailed view components**
   - Implement tabs for different sections
   - Create cards for each data type
   - Add admin actions

### Phase 4: Implement Invite User Feature

1. **Create invite user dialog**

   - Implement form with name, email, and subscription fields
   - Add validation
   - Create submission handler

2. **Implement invitation URL generation**

   - Create function to generate secure invitation URL
   - Set up Firebase Auth email link
   - Handle invitation email (placeholder for email service)

3. **Create invitation completion flow**
   - Set up route for users to complete signup
   - Implement form for password creation
   - Handle user activation

## Component Structure

```mermaid
graph TD
    A[/admin/users] --> B[UsersTable]
    A --> C[InviteUserDialog]
    A --> D[DeleteUserDialog]

    B --> E[UsersTableToolbar]
    B --> F[DataTablePagination]

    E --> G[Search Filter]
    E --> H[User Type Filter]
    E --> I[Subscription Filter]

    A --> J[/admin/users/user]
    J --> K[User Detail View]

    K --> L[User Info Card]
    K --> M[Subscription Card]
    K --> N[Products Card]
    K --> O[Prompts Card]
    K --> P[Stacks Card]
    K --> Q[Send Email Modal]
```

## Data Flow

````mermaid
sequenceDiagram
    participant User
    participant UI as User Interface
    participant Store as Jotai Store
    participant Firebase as Firebase/Firestore

    User->>UI: Visit /admin/users
    UI->>Firebase: getAllUsers()
    Firebase-->>UI: Return users data
    UI->>Store: Update usersAtom
    Store-->>UI: Render users table

    User->>UI: Select users
    UI->>Store: Update rowSelectionAtom
    Store-->>UI: Show Delete Selected button

    User->>UI: Click Delete Selected
    UI->>UI: Show confirmation dialog
    User->>UI: Confirm deletion
## Detailed Implementation Steps

### Phase 1: Setup Basic Structure

#### 1.1 Create route and basic components

First, we'll create the necessary directory structure and files:

```bash
mkdir -p web/src/app/(protected)/admin/users/components
mkdir -p web/src/app/(protected)/admin/users/actions
mkdir -p web/src/app/(protected)/admin/users/user
````

Create the main page component:

```tsx
// web/src/app/(protected)/admin/users/page.tsx
"use client";

import { useState } from "react";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Provider as JotaiProvider } from "jotai";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { toast } = useToast();

  return (
    <JotaiProvider>
      <Main>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground">
              View, manage, and invite users to your platform.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setInviteDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {/* UsersTable will be added here */}
          <p>Loading users...</p>
        </div>

        {/* InviteUserDialog will be added here */}
      </Main>
    </JotaiProvider>
  );
}
```

#### 1.2 Set up Jotai store

Create a store file for managing state:

```tsx
// web/src/app/(protected)/admin/users/users-store.ts
import { atom } from "jotai";
import { UserProfile } from "@/lib/firebase/schema";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

// Define types for user status and filters
export type UserStatus = "active" | "inactive" | "invited" | "suspended";
export type UserType = "user" | "admin" | "superadmin";
export type SubscriptionLevel = "free" | "pro" | "enterprise";

// Table state atoms
export const rowSelectionAtom = atom<Record<string, boolean>>({});
export const columnVisibilityAtom = atom<VisibilityState>({});
export const columnFiltersAtom = atom<ColumnFiltersState>([]);
export const sortingAtom = atom<SortingState>([]);
export const usersAtom = atom<UserProfile[]>([]);
export const isLoadingAtom = atom<boolean>(true);

// Filter atoms
export const searchFilterAtom = atom<string>("");
export const userTypeFilterAtom = atom<UserType | null>(null);
export const statusFilterAtom = atom<UserStatus | null>(null);
export const subscriptionFilterAtom = atom<SubscriptionLevel | null>(null);

// Current user detail view atom
export const currentUserAtom = atom<UserProfile | null>(null);

// Invite user dialog atom
export const inviteDialogOpenAtom = atom<boolean>(false);

// Delete confirmation dialog atom
export const deleteDialogOpenAtom = atom<boolean>(false);

// Selected users for deletion
export const selectedUsersAtom = atom<string[]>([]);
```

#### 1.3 Set up Firebase integration

Create action files for Firebase operations:

```tsx
// web/src/app/(protected)/admin/users/actions/index.ts
export * from "./users";
export * from "./invite";
export * from "./delete";
```

```tsx
// web/src/app/(protected)/admin/users/actions/users.ts
"use server";

import { adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/firebase/schema";

/**
 * Get all users from Firestore
 */
export async function getAllUsers() {
  try {
    // Get users collection
    const usersSnapshot = await adminDb.collection("users").get();

    if (usersSnapshot.empty) {
      return { success: true, users: [] };
    }

    // Map the documents to User objects
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
      } as UserProfile;
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string) {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        uid: userDoc.id,
        ...userDoc.data(),
      } as UserProfile,
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

```tsx
// web/src/app/(protected)/admin/users/actions/delete.ts
"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

/**
 * Delete a user from Firebase Auth and Firestore
 */
export async function deleteUser(userId: string) {
  try {
    // Start a transaction-like operation
    let authDeleted = false;
    let firestoreDeleted = false;
    let error = null;

    // Step 1: Delete user auth record
    try {
      await adminAuth.deleteUser(userId);
      authDeleted = true;
    } catch (err) {
      error = err;
      console.error(`Error deleting user auth record for ${userId}:`, err);
    }

    // Step 2: Delete user data from Firestore
    try {
      await adminDb.collection("users").doc(userId).delete();
      firestoreDeleted = true;
    } catch (err) {
      error = err;
      console.error(
        `Error deleting user data from Firestore for ${userId}:`,
        err
      );
    }

    // Check results
    if (authDeleted && firestoreDeleted) {
      // Both operations succeeded
      revalidatePath("/admin/users");
      return { success: true };
    } else {
      // At least one operation failed
      let errorMessage = "Failed to delete user completely. ";

      if (!authDeleted) {
        errorMessage += "User authentication record was not deleted. ";
      }

      if (!firestoreDeleted) {
        errorMessage += "User data in Firestore was not deleted. ";
      }

      return {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    console.error(`Error in deleteUser function for ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

```tsx
// web/src/app/(protected)/admin/users/actions/invite.ts
"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

/**
 * Invite a new user by creating their account in Firebase
 */
export async function inviteUser(
  email: string,
  name: string,
  subscriptionLevel: string
) {
  try {
    // Generate a random password for the initial account
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: name,
    });

    // Create user profile in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      displayName: name,
      userType: "user",
      subscription: subscriptionLevel.toLowerCase(),
      createdAt: new Date().toISOString(),
      isEmailVerified: false,
    });

    // Generate invitation URL
    const invitationUrl = await generateInvitationUrl(email);

    // TODO: Send invitation email with invitation URL
    // This would need an email service like Resend/SendGrid

    revalidatePath("/admin/users");

    return {
      success: true,
      user: userRecord,
      invitationUrl,
    };
  } catch (error) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate an invitation URL for a user to complete their signup
 */
async function generateInvitationUrl(email: string) {
  try {
    // Generate a sign-in link with email link
    const actionCodeSettings = {
      url: `${
        process.env.NEXT_PUBLIC_APP_URL
      }/auth/complete-signup?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };

    // Generate the email sign-in link
    const signInLink = await adminAuth.generateSignInWithEmailLink(
      email,
      actionCodeSettings
    );

    return signInLink;
  } catch (error) {
    console.error("Error generating invitation URL:", error);
    throw new Error("Failed to generate invitation URL");
  }
}
```

### Phase 2: Implement User Table

#### 2.1 Create table components

First, let's create the column header component:

```tsx
// web/src/app/(protected)/admin/users/components/data-table-column-header.tsx
"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon,
} from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterIcon } from "lucide-react";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanFilter()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <CaretSortIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          {column.getCanFilter() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.setFilterValue("")}>
                <FilterIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Filter
              </DropdownMenuItem>
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

Next, create the pagination component:

````tsx
// web/src/app/(protected)/admin/users/components/data-table-pagination.tsx
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
Now, let's create the filter dropdown component:

```tsx
// web/src/app/(protected)/admin/users/components/filter-dropdown.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterDropdown({
  title,
  options,
  value,
  onChange,
}: FilterDropdownProps) {
  return (
    <div className="flex items-center space-x-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue placeholder={title} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {title}s</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
````

Next, create the table toolbar component:

```tsx
// web/src/app/(protected)/admin/users/components/users-table-toolbar.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2 } from "lucide-react";
import { UserProfile } from "@/lib/firebase/schema";
import {
  searchFilterAtom,
  userTypeFilterAtom,
  subscriptionFilterAtom,
} from "../users-store";
import { useAtom } from "jotai";
import { FilterDropdown } from "./filter-dropdown";

interface UsersTableToolbarProps {
  table: Table<UserProfile>;
  onDeleteSelected?: () => void;
}

export function UsersTableToolbar({
  table,
  onDeleteSelected,
}: UsersTableToolbarProps) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [userTypeFilter, setUserTypeFilter] = useAtom(userTypeFilterAtom);
  const [subscriptionFilter, setSubscriptionFilter] = useAtom(
    subscriptionFilterAtom
  );

  // Get selected rows count
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  // Handle global search filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value);
    table.setGlobalFilter(e.target.value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchFilter("");
    setUserTypeFilter(null);
    setSubscriptionFilter(null);
    table.resetColumnFilters();
    table.resetGlobalFilter();
  };

  const isFiltered =
    searchFilter !== "" ||
    userTypeFilter !== null ||
    subscriptionFilter !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchFilter}
              onChange={handleSearchChange}
              className="pl-8 h-10"
            />
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedRowsCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              className="h-8"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
          <FilterDropdown
            title="User Type"
            options={[
              { label: "User", value: "user" },
              { label: "Admin", value: "admin" },
              { label: "Super Admin", value: "superadmin" },
            ]}
            value={userTypeFilter || "all"}
            onChange={(value: string) => {
              if (value === "all") {
                setUserTypeFilter(null);
                table.getColumn("userType")?.setFilterValue(undefined);
              } else {
                setUserTypeFilter(value as any);
                table.getColumn("userType")?.setFilterValue([value]);
              }
            }}
          />
          <FilterDropdown
            title="Subscription"
            options={[
              { label: "Free", value: "free" },
              { label: "Pro", value: "pro" },
              { label: "Enterprise", value: "enterprise" },
            ]}
            value={subscriptionFilter || "all"}
            onChange={(value: string) => {
              if (value === "all") {
                setSubscriptionFilter(null);
                table.getColumn("subscription")?.setFilterValue(undefined);
              } else {
                setSubscriptionFilter(value as any);
                table.getColumn("subscription")?.setFilterValue([value]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

Now, let's create the delete user dialog:

```tsx
// web/src/app/(protected)/admin/users/components/delete-user-dialog.tsx
"use client";

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
import { useAtom } from "jotai";
import { Loader2, AlertTriangle } from "lucide-react";
import { selectedUsersAtom } from "../users-store";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeleteUserDialogProps) {
  const [selectedUsers] = useAtom(selectedUsersAtom);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Delete Selected Users
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedUsers.length} selected{" "}
            {selectedUsers.length === 1 ? "user" : "users"}? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### 2.2 Create the main users table component

Now, let's create the main users table component:

````tsx
// web/src/app/(protected)/admin/users/components/users-table.tsx
"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
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
} from "../users-store";
import { UserProfile } from "@/lib/firebase/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAllUsers, deleteUser } from "../actions";
import { Badge } from "@/components/ui/badge";
import { UsersTableToolbar } from "./users-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableColumnHeader } from "./data-table-column-header";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

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
    enableFiltering: true,
  },
  // Email column
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div>{row.original.email || "N/A"}</div>,
    enableSorting: true,
    enableFiltering: true,
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
    enableFiltering: true,
  },
  // Subscription column
  {
    accessorKey: "subscription",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subscription" />
    ),
    cell: ({ row }) => {
      const subscription = row.original.subscription || "free";
      let variant: "default" | "outline" | "secondary" | "destructive" =
        "outline";

      switch (subscription) {
        case "enterprise":
          variant = "default";
          break;
        case "pro":
          variant = "secondary";
          break;
        default:
          variant = "outline";
      }

      return <Badge variant={variant}>{subscription}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
    enableFiltering: true,
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
      const date = row.original.createdAt
        ? new Date(row.original.createdAt)
        : null;

      return (
        <div>
          {date
            ? new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
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
    cell: ({ row }) => {
      const router = useRouter();
      const [, setCurrentUser] = useAtom(currentUserAtom);
      const user = row.original;

      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentUser(user);
            router.push("/admin/users/user");
          }}
        >
          View
        </Button>
      );
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
  const { toast } = useToast();

  // Delete dialog state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    async function loadUsers() {
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
    }

    loadUsers();
  }, [setUsers, toast]);

  // Update selectedUsers atom when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => users[parseInt(index)]?.uid || "")
      .filter(Boolean);

    setSelectedUsers(selectedIds);
  }, [rowSelection, users, setSelectedUsers]);

  // Reset row selection when users data changes (e.g. after deletion)
  useEffect(() => {
    if (Object.keys(rowSelection).length > 0) {
      // Check if any selected rows no longer exist
      const validSelections = Object.keys(rowSelection)
        .filter((index) => parseInt(index) < users.length)
        .reduce((acc, key) => {
          acc[key] = rowSelection[key];
          return acc;
        }, {} as Record<string, boolean>);

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
      globalFilter: searchFilter,
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
      <UsersTableToolbar
        table={table}
        onDeleteSelected={() => setDeleteDialogOpen(true)}
      />
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
#### 2.3 Update the main page component

Now, let's update the main page component to include the users table and dialogs:

```tsx
// web/src/app/(protected)/admin/users/page.tsx
"use client";

import { useState } from "react";
import { Main } from "@/components/layout/main";
import { UsersTable } from "./components/users-table";
import { Button } from "@/components/ui/button";
import { PlusIcon, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import {
  inviteDialogOpenAtom,
  deleteDialogOpenAtom,
  selectedUsersAtom,
  usersAtom,
  rowSelectionAtom,
} from "./users-store";
import { InviteUserDialog } from "./components/invite-user-dialog";
import { DeleteUserDialog } from "./components/delete-user-dialog";
import { Provider as JotaiProvider } from "jotai";
import { useToast } from "@/hooks/use-toast";
import { deleteUser } from "./actions";

export default function UsersPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useAtom(inviteDialogOpenAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useAtom(deleteDialogOpenAtom);
  const [selectedUsers] = useAtom(selectedUsersAtom);
  const [users, setUsers] = useAtom(usersAtom);
  const [, setRowSelection] = useAtom(rowSelectionAtom);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Handle deletion of selected users
  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsDeleting(true);
    try {
      let successCount = 0;
      let failedCount = 0;
      const successfullyDeletedIds: string[] = [];

      // Delete users one by one
      for (const userId of selectedUsers) {
        try {
          const result = await deleteUser(userId);
          if (result.success) {
            successCount++;
            successfullyDeletedIds.push(userId);
          } else {
            failedCount++;
            console.error(`Failed to delete user ${userId}: ${result.error}`);
          }
        } catch (err) {
          failedCount++;
          console.error(`Error deleting user ${userId}:`, err);
        }
      }

      // Update the UI based on the results
      if (successCount > 0) {
        // Update users state to remove deleted users
        setUsers((prevUsers) =>
          prevUsers.filter((user) => !successfullyDeletedIds.includes(user.uid))
        );

        // Clear row selection
        setRowSelection({});

        // Show success message
        toast({
          title: "Users deleted",
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
          description: "Failed to delete selected users.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
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

  const hasSelectedUsers = selectedUsers.length > 0;

  return (
    <JotaiProvider>
      <Main>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-muted-foreground">
              View, manage, and invite users to your platform.
            </p>
          </div>
          <div className="flex gap-2">
            {hasSelectedUsers && (
              <Button
                variant={hasSelectedUsers ? "destructive" : "outline"}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={!hasSelectedUsers || isDeleting}
                className={
                  hasSelectedUsers
                    ? ""
                    : "text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected{" "}
                {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </Button>
            )}
            <Button onClick={() => setInviteDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>

        <UsersTable />

        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />

        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDelete={handleDeleteUsers}
          isDeleting={isDeleting}
        />
      </Main>
    </JotaiProvider>
  );
}
````

### Phase 3: Create Invite User Dialog

Let's create the invite user dialog component:

```tsx
// web/src/app/(protected)/admin/users/components/invite-user-dialog.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { inviteUser } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subscription: z.string().min(1, "Subscription level is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function InviteUserDialog({
  open,
  onOpenChange,
}: InviteUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subscription: "free",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const result = await inviteUser(
        values.email,
        values.name,
        values.subscription
      );

      if (result.success) {
        toast({
          title: "User invited successfully",
          description: `An invitation has been sent to ${values.email}`,
        });

        form.reset();
        onOpenChange(false);
      } else {
        toast({
          title: "Failed to invite user",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new user to the platform.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subscription level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Invite User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 4: Create User Detail View

#### 4.1 Create functions to fetch user-related data

First, let's create functions to fetch user-related data:

```tsx
// web/src/app/(protected)/admin/users/actions/user-data.ts
"use server";

import { adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/firebase/schema";

/**
 * Get user's products
 */
export async function getUserProducts(userId: string) {
  try {
    const productsSnapshot = await adminDb
      .collection("products")
      .where("userId", "==", userId)
      .get();

    if (productsSnapshot.empty) {
      return { success: true, products: [] };
    }

    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, products };
  } catch (error) {
    console.error(`Error fetching products for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user's prompts
 */
export async function getUserPrompts(userId: string) {
  try {
    const promptsSnapshot = await adminDb
      .collection("prompts")
      .where("userId", "==", userId)
      .get();

    if (promptsSnapshot.empty) {
      return { success: true, prompts: [] };
    }

    const prompts = promptsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, prompts };
  } catch (error) {
    console.error(`Error fetching prompts for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user's tech stacks
 */
export async function getUserTechStacks(userId: string) {
  try {
    const techStacksSnapshot = await adminDb
      .collection("techStacks")
      .where("userId", "==", userId)
      .get();

    if (techStacksSnapshot.empty) {
      return { success: true, techStacks: [] };
    }

    const techStacks = techStacksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, techStacks };
  } catch (error) {
    console.error(`Error fetching tech stacks for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get user's subscription details
 */
export async function getUserSubscription(userId: string) {
  try {
    const subscriptionSnapshot = await adminDb
      .collection("subscriptions")
      .where("userId", "==", userId)
      .get();

    if (subscriptionSnapshot.empty) {
      return { success: true, subscription: null };
    }

    const subscription = {
      id: subscriptionSnapshot.docs[0].id,
      ...subscriptionSnapshot.docs[0].data(),
    };

    return { success: true, subscription };
  } catch (error) {
    console.error(`Error fetching subscription for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all user data in one call
 */
export async function getUserAllData(userId: string) {
  try {
    const [
      productsResult,
      promptsResult,
      techStacksResult,
      subscriptionResult,
    ] = await Promise.all([
      getUserProducts(userId),
      getUserPrompts(userId),
      getUserTechStacks(userId),
      getUserSubscription(userId),
    ]);

    return {
      success: true,
      products: productsResult.success ? productsResult.products : [],
      prompts: promptsResult.success ? promptsResult.prompts : [],
      techStacks: techStacksResult.success ? techStacksResult.techStacks : [],
      subscription: subscriptionResult.success
        ? subscriptionResult.subscription
        : null,
    };
  } catch (error) {
    console.error(`Error fetching all data for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

#### 4.2 Create Send Email Modal

Let's create the Send Email modal component:

```tsx
// web/src/app/(protected)/admin/users/components/send-email-dialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

const formSchema = z.object({
  from: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function SendEmailDialog({
  open,
  onOpenChange,
  userEmail,
}: SendEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "noreply@example.com",
      subject: "",
      body: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      // TODO: Implement email sending functionality
      // This would connect to your email service

      // For now, just simulate a successful email send
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Email sent",
        description: `Email has been sent to ${userEmail}`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to send email",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Send an email to {userEmail}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

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

```

          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

);
}

```

    UI->>Firebase: deleteUser() for each selected user
    Firebase-->>UI: Confirm deletion
    UI->>Store: Update usersAtom
    Store-->>UI: Re-render users table

    User->>UI: Click Invite User
    UI->>UI: Show invite user dialog
    User->>UI: Fill in user details
    UI->>Firebase: inviteUser()
    Firebase-->>UI: Return success/failure
    UI->>Store: Update usersAtom
    Store-->>UI: Re-render users table

    User->>UI: Click View on a user
    UI->>Store: Update currentUserAtom
    UI->>UI: Navigate to /admin/users/user
    UI->>Firebase: getUserById()
    Firebase-->>UI: Return detailed user data
    UI->>UI: Render user detail view

```

```

```

```

#### 4.3 Create User Detail View Component

Now, let's create the user detail view component:

```tsx
// web/src/app/(protected)/admin/users/user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { currentUserAtom } from "../users-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Shield,
  CreditCard,
  Send,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getUserById } from "../actions";
import { getUserAllData } from "../actions/user-data";
import { UserProfile } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { SendEmailDialog } from "../components/send-email-dialog";

export default function UserDetailPage() {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const [userData, setUserData] = useState<UserProfile | null>(currentUser);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [userPrompts, setUserPrompts] = useState<any[]>([]);
  const [userTechStacks, setUserTechStacks] = useState<any[]>([]);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Redirect to users list if no user is selected
  useEffect(() => {
    if (!currentUser) {
      router.push("/admin/users");
    }
  }, [currentUser, router]);

  // Load user data
  useEffect(() => {
    async function loadUserDetails() {
      if (currentUser?.uid) {
        setLoading(true);
        try {
          // Load basic user data
          const userResult = await getUserById(currentUser.uid);
          if (userResult.success) {
            setUserData(userResult.user);
          } else {
            toast({
              title: "Error",
              description: userResult.error || "Failed to load user details",
              variant: "destructive",
            });
          }

          // Load additional user data
          const allData = await getUserAllData(currentUser.uid);
          if (allData.success) {
            setUserProducts(allData.products || []);
            setUserPrompts(allData.prompts || []);
            setUserTechStacks(allData.techStacks || []);
            setUserSubscription(allData.subscription);
          } else {
            toast({
              title: "Error",
              description: "Failed to load some user data",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to load user details:", error);
          toast({
            title: "Error",
            description: "Failed to load user details",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    }

    loadUserDetails();
  }, [currentUser, toast]);

  // If we're redirecting or loading, show minimal content
  if (!userData || loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </Main>
    );
  }

  // Format the date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const displayName = userData.displayName || "";
    if (!displayName) return "U";

    // Get first letter of each word
    return displayName
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Main>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          {
            label: userData.displayName || userData.email || "User Details",
            isCurrentPage: true,
          },
        ]}
        className="mb-4"
      />

      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/users")}
          className="mb-2 sm:mb-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm">
            Delete User
          </Button>
          <Button size="sm">Edit User</Button>
        </div>
      </div>

      {/* User profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User info card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              {userData.photoURL ? (
                <AvatarImage
                  src={userData.photoURL}
                  alt={userData.displayName || ""}
                />
              ) : null}
              <AvatarFallback className="text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>
                {userData.displayName || userData.email || "User"}
              </CardTitle>
              <CardDescription>
                {userData.userType && (
                  <Badge variant="outline" className="mt-1">
                    {userData.userType}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                {userData.email || "No email"}
              </div>

              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                ID: {userData.uid}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Account</h3>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  Created
                </div>
                <span>{formatDate(userData.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                  Verified
                </div>
                <span>{userData.isEmailVerified ? "Yes" : "No"}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  Subscription
                </div>
                <Badge
                  variant={
                    userData.subscription === "enterprise"
                      ? "default"
                      : "outline"
                  }
                >
                  {userData.subscription || "Free"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User details tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="stacks">Stacks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Stats</CardTitle>
                  <CardDescription>
                    Summary of user activity and contributions
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">
                      XP Points
                    </span>
                    <span className="text-2xl font-bold">
                      {userData.xp || 0}
                    </span>
                  </div>
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">Level</span>
                    <span className="text-2xl font-bold">
                      {userData.level || 0}
                    </span>
                  </div>
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">
                      Onboarding
                    </span>
                    <span className="text-2xl font-bold">
                      {userData.hasCompletedOnboarding
                        ? "Completed"
                        : "Incomplete"}
                    </span>
                  </div>
                  <div className="flex flex-col border rounded-lg p-4">
                    <span className="text-sm text-muted-foreground">
                      Timeline Question
                    </span>
                    <span className="text-2xl font-bold">
                      {userData.hasAnsweredTimelineQuestion
                        ? "Answered"
                        : "Unanswered"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {userData.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{userData.bio}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>
                    Current subscription plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userSubscription ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Plan Type
                          </h3>
                          <p className="text-lg font-semibold">
                            {userSubscription.planType}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Billing Cycle
                          </h3>
                          <p className="text-lg font-semibold">
                            {userSubscription.billingCycle}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Price
                          </h3>
                          <p className="text-lg font-semibold">
                            ${userSubscription.price}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">
                            Status
                          </h3>
                          <Badge
                            variant={
                              userSubscription.active ? "default" : "outline"
                            }
                          >
                            {userSubscription.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Stripe Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Customer ID
                            </p>
                            <p className="text-sm font-mono">
                              {userSubscription.stripeCustomerId}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Subscription ID
                            </p>
                            <p className="text-sm font-mono">
                              {userSubscription.stripeSubscriptionId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No subscription data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>
                      Products created by this user
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{userProducts.length}</Badge>
                </CardHeader>
                <CardContent>
                  {userProducts.length > 0 ? (
                    <div className="space-y-4">
                      {userProducts.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No products data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Prompts</CardTitle>
                    <CardDescription>
                      Prompts created by this user
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{userPrompts.length}</Badge>
                </CardHeader>
                <CardContent>
                  {userPrompts.length > 0 ? (
                    <div className="space-y-4">
                      {userPrompts.map((prompt) => (
                        <div key={prompt.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{prompt.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {prompt.body.substring(0, 100)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No prompts data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stacks" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tech Stacks</CardTitle>
                    <CardDescription>
                      Tech stacks created by this user
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{userTechStacks.length}</Badge>
                </CardHeader>
                <CardContent>
                  {userTechStacks.length > 0 ? (
                    <div className="space-y-4">
                      {userTechStacks.map((stack) => (
                        <div key={stack.id} className="border rounded-lg p-4">
                          <h3 className="font-medium">{stack.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stack.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {stack.tags?.map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No tech stacks data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Admin actions */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Admin Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setSendEmailOpen(true)}
            className="flex items-center"
          >
            <Send className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          {/* Other admin actions */}
        </div>
      </div>

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
        userEmail={userData.email || ""}
      />
    </Main>
  );
}
```

## Timeline and Milestones

### Week 1: Setup and Basic Implementation

1. **Day 1-2: Setup Basic Structure**

   - Create route and directory structure
   - Set up Jotai store
   - Implement Firebase integration functions

2. **Day 3-5: Implement User Table**
   - Create table components
   - Implement filtering and sorting
   - Add row selection and delete functionality

### Week 2: Advanced Features

1. **Day 1-2: Create Invite User Feature**

   - Implement invite user dialog
   - Create invitation URL generation
   - Set up email sending (placeholder)

2. **Day 3-5: Implement User Detail View**
   - Create user detail page
   - Implement data fetching from Firebase
   - Create tabs for different sections

### Week 3: Testing and Refinement

1. **Day 1-2: Testing**

   - Test all functionality
   - Fix any bugs or issues
   - Ensure proper error handling

2. **Day 3-5: Refinement and Documentation**
   - Optimize performance
   - Add loading states
   - Document the implementation

## Conclusion

This implementation plan provides a comprehensive approach to creating a new `/admin/users` route that will display and manage users from the Firebase `/users` collection. By following this plan, we'll create a fully functional user management system with features for viewing, filtering, and managing users, as well as a detailed user view and invitation functionality.

The plan includes detailed implementation steps and code examples for all components, making it easy to follow and implement. The timeline and milestones provide a clear roadmap for the development process, ensuring that the project stays on track and is completed within the expected timeframe.

## Additional Implementation Details

### Row Selection and Delete Selected Button

Based on the interaction patterns from `/admin/courses`, the row selection and Delete Selected button should work as follows:

1. **Row Selection**:

   - Users can select rows by clicking the checkbox in the first column of each row
   - The checkbox in the table header selects/deselects all rows on the current page
   - Selected rows are highlighted with a light background color
   - The selection state is stored in the `rowSelectionAtom` Jotai atom
   - When rows are selected, the `selectedUsersAtom` is updated with the UIDs of the selected users

2. **Delete Selected Button**:

   - The Delete Selected button should appear in the top-right corner of the page, next to the "Invite User" button
   - It should only be visible when one or more rows are selected
   - The button should be red (destructive variant) to indicate a dangerous action
   - It should display the count of selected users, e.g., "Delete Selected (3)"
   - The button should be disabled during the deletion process

3. **Delete Confirmation Modal**:
   - Clicking the Delete Selected button should open a confirmation modal
   - The modal should be centered on the screen
   - It should display a warning message with the number of selected users
   - It should have "Cancel" and "Delete" buttons
   - The "Delete" button should be red and show a loading spinner during deletion

Here's the specific implementation for the Delete Selected button in the page component:

```tsx
// In web/src/app/(protected)/admin/users/page.tsx
<div className="flex gap-2">
  {hasSelectedUsers && (
    <Button
      variant="destructive"
      onClick={() => setDeleteDialogOpen(true)}
      disabled={isDeleting}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Selected {selectedUsers.length > 0 && `(${selectedUsers.length})`}
    </Button>
  )}
  <Button onClick={() => setInviteDialogOpen(true)}>
    <PlusIcon className="mr-2 h-4 w-4" />
    Invite User
  </Button>
</div>
```

And the confirmation modal:

```tsx
<DeleteUserDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onDelete={handleDeleteUsers}
  isDeleting={isDeleting}
/>
```

### Invitation URL Creation and User Flow

#### Creating the Invitation URL

The invitation URL is created using Firebase Auth's email link functionality. Here's a detailed explanation of how it works:

1. **Generate Invitation URL**:

   - When an admin invites a user, we create a temporary user account in Firebase Auth
   - We also create a user document in Firestore with the user's information
   - We then generate a secure sign-in link using `adminAuth.generateSignInWithEmailLink()`
   - This link contains a secure token that allows the user to sign in without a password

2. **URL Structure**:
   - The URL should point to a page where the user can complete their signup
   - It should include the user's email as a query parameter
   - The URL should be configured to be handled by the app (handleCodeInApp: true)

Here's the detailed implementation:

```typescript
/**
 * Generate an invitation URL for a user to complete their signup
 */
async function generateInvitationUrl(email: string) {
  try {
    // Define the URL where the user will complete their signup
    const continueUrl = new URL(
      "/auth/complete-signup",
      process.env.NEXT_PUBLIC_APP_URL
    );

    // Add the email as a query parameter
    continueUrl.searchParams.append("email", email);

    // Configure the action code settings
    const actionCodeSettings = {
      url: continueUrl.toString(),
      handleCodeInApp: true,
    };

    // Generate the email sign-in link
    const signInLink = await adminAuth.generateSignInWithEmailLink(
      email,
      actionCodeSettings
    );

    return signInLink;
  } catch (error) {
    console.error("Error generating invitation URL:", error);
    throw new Error("Failed to generate invitation URL");
  }
}
```

#### User Flow After Receiving Invitation

When a user receives an invitation email and clicks on the link, they should go through the following steps:

1. **Landing on Complete Signup Page**:

   - The user clicks the link in their email and lands on the `/auth/complete-signup` page
   - The page extracts the email from the URL query parameters
   - It verifies that the link is valid using `isSignInWithEmailLink` from Firebase Auth

2. **Setting Up Password**:

   - The user is presented with a form to create a password
   - They may also be asked to confirm their name or other details
   - The form should include validation for password strength

3. **Completing Signup**:
   - When the user submits the form, we use `signInWithEmailLink` to authenticate them
   - We then update their account with the new password using `updatePassword`
   - We also update their user profile in Firestore to mark them as having completed signup
   - Finally, we redirect them to the appropriate page based on their user type

Here's the implementation for the complete signup page:

```tsx
// web/src/app/auth/complete-signup/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
} from "firebase/auth";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function CompleteSignupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();
  const db = getFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if the URL contains a sign-in link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // Get the email from URL parameters
      const emailFromUrl = searchParams.get("email");

      if (emailFromUrl) {
        setEmail(emailFromUrl);
        setIsLoading(false);
      } else {
        // If email is not available in URL, prompt user to provide it
        const userEmail = window.prompt(
          "Please provide your email for confirmation"
        );

        if (userEmail) {
          setEmail(userEmail);
          setIsLoading(false);
        } else {
          // User cancelled the prompt
          toast({
            title: "Error",
            description: "Email is required to complete signup",
            variant: "destructive",
          });
          router.push("/auth/signin");
        }
      }
    } else {
      // If not a sign-in link, redirect to sign-in page
      toast({
        title: "Invalid link",
        description: "The link you clicked is invalid or has expired",
        variant: "destructive",
      });
      router.push("/auth/signin");
    }
  }, [auth, router, searchParams]);

  async function onSubmit(values: FormValues) {
    if (!email) return;

    setIsSubmitting(true);

    try {
      // Sign in with email link
      const result = await signInWithEmailLink(
        auth,
        email,
        window.location.href
      );

      // Update password
      if (result.user) {
        await updatePassword(result.user, values.password);

        // Update user document in Firestore
        const userRef = doc(db, "users", result.user.uid);
        await updateDoc(userRef, {
          isEmailVerified: true,
          hasCompletedSignup: true,
        });

        toast({
          title: "Signup completed",
          description: "Your account has been set up successfully",
        });

        // Redirect to dashboard or appropriate page
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error completing signup:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete signup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Signup</CardTitle>
          <CardDescription>
            Create a password to finish setting up your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input value={email || ""} disabled />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up account...
                  </>
                ) : (
                  "Complete Signup"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth/signin" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

This implementation ensures that:

1. The invitation URL is securely generated using Firebase Auth
2. The user can complete their signup by setting a password
3. Their account is properly updated in both Firebase Auth and Firestore
4. They are redirected to the appropriate page after completing signup
