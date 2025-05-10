"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Feature } from "@/lib/firebase/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";

export const getFeatureColumns = (): ColumnDef<Feature, unknown>[] => [
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
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()} // Prevent row click from triggering when clicking checkbox
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
      return (
        <div className="font-medium max-w-[250px] truncate">
          {row.getValue("name")}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false, // Usually, name is not hidden
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[300px] truncate text-sm">
          {description || "N/A"}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "Active"
              ? "default"
              : status === "Inactive"
                ? "secondary"
                : "outline"
          }
        >
          {status}
        </Badge>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      if (!tags || tags.length === 0) {
        return <div className="text-muted-foreground italic text-xs">None</div>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
    filterFn: (row, id, value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }
      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      // Access handlers from table.options.meta
      const meta = table.options.meta as
        | {
            onViewFeature: (feature: Feature) => void;
            onEditFeature: (feature: Feature) => void;
            onDeleteFeature: (feature: Feature) => void;
          }
        | undefined;

      if (
        !meta?.onViewFeature ||
        !meta?.onEditFeature ||
        !meta?.onDeleteFeature
      ) {
        return null;
      }

      return (
        <DataTableRowActions
          row={row.original}
          onView={meta.onViewFeature}
          onEdit={meta.onEditFeature}
          onDelete={meta.onDeleteFeature}
        />
      );
    },
  },
];
