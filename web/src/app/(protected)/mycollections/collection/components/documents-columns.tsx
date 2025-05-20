"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Document, DocumentStatus } from "@/lib/firebase/schema";
import { DataTableColumnHeader } from "@/app/(protected)/myprompts/components/data-table-column-header";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Download,
  MoreHorizontal,
  Trash,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentsColumnsProps {
  onDelete?: (document: Document) => void;
  onStatusUpdate?: (document: Document, status: DocumentStatus) => void;
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
}

// Define the column meta type to include custom properties
interface ColumnMeta {
  className?: string;
  align?: "left" | "center" | "right";
}

export const getColumns = ({
  onDelete,
  onStatusUpdate,
  onView,
  onEdit,
}: DocumentsColumnsProps): ColumnDef<Document, any>[] => [
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
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
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
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[300px] truncate text-muted-foreground">
          {description || "No description"}
        </div>
      );
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
      const status = row.getValue("status") as DocumentStatus;
      const document = row.original as Document;

      const getStatusLabel = (status: DocumentStatus) => {
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

      // Render different badges based on status
      const renderStatusBadge = () => {
        if (status === "indexing") {
          return (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 cursor-pointer"
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Indexing
            </Badge>
          );
        } else if (status === "indexed") {
          return (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 cursor-pointer"
            >
              Indexed
            </Badge>
          );
        } else {
          return (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-700 cursor-pointer"
            >
              {getStatusLabel(status)}
            </Badge>
          );
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {renderStatusBadge()}
          </DropdownMenuTrigger>
          {onStatusUpdate && (
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onStatusUpdate(document, "uploading")}
                className={cn(status === "uploading" && "bg-muted")}
              >
                Uploading
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusUpdate(document, "uploaded")}
                className={cn(status === "uploaded" && "bg-muted")}
              >
                Uploaded
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusUpdate(document, "indexing")}
                className={cn(status === "indexing" && "bg-muted")}
              >
                Indexing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusUpdate(document, "indexed")}
                className={cn(status === "indexed" && "bg-muted")}
              >
                Indexed
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusUpdate(document, "reindexing")}
                className={cn(status === "reindexing" && "bg-muted")}
              >
                Reindexing
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const status = row.getValue(id) as DocumentStatus;
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
    cell: ({ row }) => {
      const document = row.original as Document;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onView && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onView(document);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
            )}

            {onEdit && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(document);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}

            {document.url && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(document.url, "_blank");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}

            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(document);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    meta: {
      align: "right",
    } as ColumnMeta,
  },
];
