"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collection, CollectionStatus } from "@/lib/firebase/schema";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import { DataTableColumnHeader } from "@/app/(protected)/myprompts/components/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface CollectionsColumnsProps {
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
  onTagClick?: (tag: string) => void;
  onStatusClick?: (status: CollectionStatus) => void;
}

// Define the column meta type to include custom properties
interface ColumnMeta {
  className?: string;
  align?: "left" | "center" | "right";
}

export const getColumns = ({
  onEdit,
  onDelete,
  onTagClick,
  onStatusClick,
}: CollectionsColumnsProps): ColumnDef<Collection, any>[] => [
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
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium max-w-[300px] truncate">
          {row.getValue("title")}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "phaseTags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phases" />
    ),
    cell: ({ row }) => {
      const phases = row.getValue("phaseTags") as string[];

      if (!phases || phases.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {phases.map((phase) => (
            <Badge
              key={phase}
              variant="secondary"
              className={cn(
                getPhaseColor(phase),
                onTagClick && "cursor-pointer"
              )}
              onClick={(e) => {
                if (onTagClick) {
                  e.stopPropagation();
                  onTagClick(phase);
                }
              }}
            >
              {phase}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const phases = row.getValue(id) as string[];
      return value.some((val: string) => phases.includes(val));
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
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="bg-muted">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="bg-muted">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as CollectionStatus;

      const getStatusLabel = (status: CollectionStatus) => {
        switch (status) {
          case "uploading":
            return "Uploading";
          case "uploaded":
            return "Uploaded";
          case "indexing":
            return "Indexing";
          case "indexed":
            return "Indexed";
          case "reindexing":
            return "Reindexing";
          default:
            return status;
        }
      };

      if (status === "indexing") {
        return (
          <Badge
            variant="secondary"
            className={cn(
              "bg-blue-100 text-blue-700",
              onStatusClick && "cursor-pointer"
            )}
            onClick={(e) => {
              if (onStatusClick) {
                e.stopPropagation();
                onStatusClick(status);
              }
            }}
          >
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Indexing
          </Badge>
        );
      } else if (status === "indexed") {
        return (
          <Badge
            variant="secondary"
            className={cn(
              "bg-green-100 text-green-700",
              onStatusClick && "cursor-pointer"
            )}
            onClick={(e) => {
              if (onStatusClick) {
                e.stopPropagation();
                onStatusClick(status);
              }
            }}
          >
            Indexed
          </Badge>
        );
      } else {
        return (
          <Badge
            variant="secondary"
            className={cn(
              "bg-gray-100 text-gray-700",
              onStatusClick && "cursor-pointer"
            )}
            onClick={(e) => {
              if (onStatusClick) {
                e.stopPropagation();
                onStatusClick(status);
              }
            }}
          >
            {getStatusLabel(status)}
          </Badge>
        );
      }
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const status = row.getValue(id) as CollectionStatus;
      return value.includes(status);
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Modified" />
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as number;
      if (!updatedAt) return <div>Invalid Date</div>;

      return (
        <div>
          {formatDistanceToNow(new Date(updatedAt * 1000), { addSuffix: true })}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onEdit={() => onEdit?.(row.original as Collection)}
        onDelete={() => onDelete?.(row.original as Collection)}
        onClick={() => {}}
      />
    ),
    meta: {
      align: "right",
    } as ColumnMeta,
  },
];
