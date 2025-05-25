"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
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
  productsAtom,
  rowSelectionAtom,
  columnFiltersAtom,
  sortingAtom,
  columnVisibilityAtom,
  selectedProductsAtom,
  currentProductAtom,
  searchFilterAtom,
  tableInstanceAtom,
  AdminProduct,
} from "../products-store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProductsTableToolbar } from "./products-table-toolbar";
import { DataTableColumnHeader } from "./data-table-column-header";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminProducts } from "@/lib/firebase/client/FirebaseAdminProducts";
import { deleteMultipleProducts } from "../actions/delete";
import { useAction } from "next-safe-action/hooks";
import { useToast } from "@/hooks/use-toast";

export const columns: ColumnDef<AdminProduct>[] = [
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
  // Product Title column
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div>
          <div className="font-medium">
            {row.original.title || "Unnamed Product"}
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
      <div className="font-mono text-sm truncate max-w-[120px]">
        {row.original.userId}
      </div>
    ),
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Phase column
  {
    accessorKey: "phases",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phase" />
    ),
    cell: ({ row }) => {
      const primaryPhase = row.original.phases?.[0] || "Discover";
      return <Badge variant="outline">{primaryPhase}</Badge>;
    },
    filterFn: (row, id, value) => {
      const phases = row.getValue(id) as string[];
      if (!phases || phases.length === 0) return value.includes("Discover");
      return phases.some((phase) => value.includes(phase));
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Status column
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
      const isPublic = row.getValue(id) as boolean;
      const status = isPublic ? "public" : "private";
      return value.includes(status);
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Country column
  {
    accessorKey: "country",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Country" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.country || "N/A"}</span>
    ),
    filterFn: (row, id, value) => {
      const country = row.getValue(id) as string;
      return value.includes(country || "");
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  // Website column
  {
    accessorKey: "website",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Website" />
    ),
    cell: ({ row }) => {
      const website = row.original.website;
      return website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-[150px] block"
        >
          {website.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      );
    },
    enableSorting: true,
  },
  // Created date column
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const timestamp = row.original.createdAt;
      if (!timestamp) return "N/A";
      const ts = timestamp > 1e10 ? timestamp : timestamp * 1000;
      const date = new Date(ts);
      return date.toLocaleDateString();
    },
    enableSorting: true,
  },
  // Updated date column
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const timestamp = row.original.updatedAt;
      if (!timestamp) return "N/A";
      const ts = timestamp > 1e10 ? timestamp : timestamp * 1000;
      const date = new Date(ts);
      return date.toLocaleDateString();
    },
    enableSorting: true,
  },
];

export function ProductsTable() {
  const [products, setProducts] = useAtom(productsAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const [columnFilters, setColumnFilters] = useAtom(columnFiltersAtom);
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [columnVisibility, setColumnVisibility] = useAtom(columnVisibilityAtom);
  const [selectedProducts, setSelectedProducts] = useAtom(selectedProductsAtom);
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [, setTableInstance] = useAtom(tableInstanceAtom);
  const setCurrentProduct = useSetAtom(currentProductAtom);
  const router = useRouter();
  const { toast } = useToast();

  // Delete dialog state
  const [isDeleting, setIsDeleting] = useState(false);

  // Use React Firebase Hooks for real-time data
  const [firebaseProducts, loading, error] = useCollectionData(
    firebaseAdminProducts.getProductsCountQuery()
  );

  // Mock data for demonstration
  const mockProducts = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - 7 * 24 * 60 * 60;
    const oneMonthAgo = now - 30 * 24 * 60 * 60;

    return [
      {
        id: "mock-1",
        title: "TaskFlow Pro",
        description: "Advanced task management application with AI insights",
        createdAt: oneWeekAgo,
        updatedAt: now - 2 * 24 * 60 * 60,
        userId: "user-abc123",
        phases: ["Build"],
        website: "https://taskflow.app",
        country: "United States",
        isPublic: true,
      },
      {
        id: "mock-2",
        title: "EcoTracker",
        description: "Sustainability tracking for individuals and businesses",
        createdAt: oneMonthAgo,
        updatedAt: oneWeekAgo,
        userId: "user-def456",
        phases: ["Launch"],
        website: "",
        country: "Canada",
        isPublic: false,
      },
      {
        id: "mock-3",
        title: "CodeMentor AI",
        description: "AI-powered code review and mentoring platform",
        createdAt: now - 3 * 24 * 60 * 60,
        updatedAt: now - 1 * 24 * 60 * 60,
        userId: "user-ghi789",
        phases: ["Validate"],
        website: "https://codementor-ai.dev",
        country: "United Kingdom",
        isPublic: true,
      },
      {
        id: "mock-4",
        title: "LocalMarket",
        description: "Connecting local producers with consumers",
        createdAt: oneMonthAgo - 10 * 24 * 60 * 60,
        updatedAt: oneMonthAgo,
        userId: "user-jkl012",
        phases: ["Discover"],
        website: "",
        country: "Germany",
        isPublic: false,
      },
      {
        id: "mock-5",
        title: "FitnessPal Pro",
        description: "Personal fitness coaching with AR workouts",
        createdAt: now - 5 * 24 * 60 * 60,
        updatedAt: now - 12 * 60 * 60,
        userId: "user-mno345",
        phases: ["Design"],
        website: "https://fitnesspal.pro",
        country: "Australia",
        isPublic: true,
      },
    ];
  }, []);

  // Convert Firebase products or use mock data
  const effectiveProducts = useMemo(() => {
    if (firebaseProducts && firebaseProducts.length > 0) {
      return firebaseProducts.map((product: any) => ({
        id: product.id,
        title: product.name || "Untitled",
        description: product.description || "",
        createdAt: product.createdAt || 0,
        updatedAt: product.updatedAt || product.createdAt || 0,
        userId: product.userId || "unknown",
        isPublic: !!(product.website || product.isPublic),
        phases: product.phases || ["Discover"],
        website: product.website || "",
        country: product.country || "",
        views: product.views || 0,
        likes: product.likes || 0,
        tags: product.phases || [],
      })) as AdminProduct[];
    } else if (!loading) {
      return mockProducts as AdminProduct[];
    }
    return [];
  }, [firebaseProducts, loading, mockProducts]);

  // Update products atom when data changes
  useEffect(() => {
    setProducts(effectiveProducts);
  }, [effectiveProducts, setProducts]);

  // Update selectedProducts atom when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => products[parseInt(index)]?.id || "")
      .filter(Boolean);

    setSelectedProducts(selectedIds);
  }, [rowSelection, products, setSelectedProducts]);

  const table = useReactTable({
    data: products,
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

  // Delete action
  const { execute: executeDelete } = useAction(deleteMultipleProducts, {
    onSuccess: (data) => {
      console.log("Delete success:", data);
      if (data.data?.success) {
        toast({
          title: "Success",
          description: data.data.message,
        });
        // Clear selection after successful deletion
        setRowSelection({});
      } else {
        toast({
          title: "Error",
          description: data.data?.error || "Failed to delete products",
          variant: "destructive",
        });
      }
      setIsDeleting(false);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;

    setIsDeleting(true);

    // Execute the delete action
    executeDelete({
      productIds: selectedProducts,
    });
  };

  const handleRowClick = (product: AdminProduct) => {
    // Set the current product in the atom
    setCurrentProduct(product);

    // Navigate to the product detail page
    router.push("/admin/products/product");
  };

  return (
    <div className="space-y-4">
      {/* Table Header with Title and Delete Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Products Table</h3>
        {selectedProducts.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting
              ? "Deleting..."
              : `Delete ${selectedProducts.length} selected`}
          </Button>
        )}
      </div>

      <ProductsTableToolbar table={table} />

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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Don't navigate if clicking on checkbox
                    if (
                      (e.target as HTMLElement).closest(
                        'input[type="checkbox"]'
                      )
                    ) {
                      return;
                    }
                    handleRowClick(row.original);
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
                  {loading ? "Loading..." : "No products found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
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
            >
              <span className="sr-only">Go to first page</span>
              ««
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>‹
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>›
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              »»
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
