"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "@/lib/firebase/schema";
import { formatDistance } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPhaseColor } from "./phase-filter";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./data-table-column-header";

export interface ColumnProps {
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPhaseClick?: (phase: string) => void;
  onClick?: (product: Product) => void;
}

export const getColumns = ({
  onEdit,
  onDelete,
  onPhaseClick,
  onClick,
}: ColumnProps): ColumnDef<Product>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => {
          console.log("Select all checkbox changed to:", value);
          table.toggleAllPageRowsSelected(!!value);
        }}
        aria-label="Select all"
        data-testid="select-all-products"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          console.log(`Row ${row.id} selection changed to:`, value);
          row.toggleSelected(!!value);
        }}
        aria-label="Select row"
        data-testid={`select-product-${row.id}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div
          className="cursor-pointer font-medium hover:underline"
          onClick={() => onClick && onClick(product)}
          data-testid={`product-row-${product.id}`}
        >
          {product.name}
        </div>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="line-clamp-2 max-w-md">
          {product.description || "No description provided"}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phase" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <Badge
          className={`cursor-pointer ${getPhaseColor(product.phases?.[0] || "Discover")}`}
          variant="outline"
          onClick={() =>
            onPhaseClick && onPhaseClick(product.phases?.[0] || "Discover")
          }
        >
          {product.phases?.[0] || "Discover"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
    enableColumnFilter: true,
  },
  {
    id: "tags",
    accessorFn: (row) => (row as any).tags || [],
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ getValue }) => {
      const tags = getValue() as string[];
      if (!tags || tags.length === 0) return null;

      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag, index) => (
            <Badge
              key={`tag-${index}-${tag}`}
              variant="outline"
              className="mr-1"
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge key="tag-more" variant="outline">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const tags = row.getValue(id) as string[];
      if (!tags || !Array.isArray(tags)) return false;
      return value.some((val: string) => tags.includes(val));
    },
    enableSorting: false,
    enableColumnFilter: true,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      // Use the timestamp directly if available, otherwise fallback to current time
      const timestamp = product.updatedAt || Date.now();

      // Check if timestamp is in seconds (Firebase often stores in seconds)
      // and convert to milliseconds if needed
      const timeInMs = timestamp > 1e10 ? timestamp : timestamp * 1000;
      const date = new Date(timeInMs);

      return (
        <div className="text-sm text-muted-foreground">
          {formatDistance(date, new Date(), { addSuffix: true })}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const product = row.original;

      // Create a click handler that prevents propagation
      const handleMenuItemClick = (
        e: React.MouseEvent,
        callback: (product: Product) => void
      ) => {
        e.stopPropagation();
        e.preventDefault();
        callback(product);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              data-testid={`actions-dropdown-${product.id}`}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              onClick={(e) => onClick && handleMenuItemClick(e, onClick)}
              data-testid={`view-product-${product.id}`}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => handleMenuItemClick(e, onEdit)}
                data-testid={`edit-product-${product.id}`}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={(e) => handleMenuItemClick(e, onDelete)}
                className="text-destructive focus:text-destructive cursor-pointer"
                data-testid={`delete-product-${product.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
