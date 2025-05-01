"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Module } from "@/lib/firebase/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpDown, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { PLACEHOLDER_IMAGE_URL } from "@/utils/constants";

// Simple column header component
function DataTableColumnHeader({
  column,
  title,
}: {
  column: any;
  title: string;
}) {
  if (!column.getCanSort()) {
    return <div>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

export const columns: ColumnDef<Module>[] = [
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
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "coverUrl",
    header: "",
    cell: ({ row }) => {
      const coverUrl = row.getValue("coverUrl") as string | undefined;
      return (
        <div className="relative h-12 w-16 overflow-hidden rounded-md">
          <Image
            src={coverUrl || PLACEHOLDER_IMAGE_URL}
            alt={row.getValue("title")}
            fill
            className="object-cover"
          />
        </div>
      );
    },
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
        <div className="font-medium">{row.getValue("title") as string}</div>
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
      if (!tags || tags.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
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
    filterFn: (row, id, filterValue) => {
      const tags = row.getValue(id) as string[];
      if (!tags || !Array.isArray(tags)) return false;
      return tags.some((tag) =>
        tag.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  },
  {
    accessorKey: "xpAwards",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="XP" />
    ),
    cell: ({ row }) => {
      const xp = row.getValue("xpAwards") as number;
      return (
        <div className="text-right font-medium">{xp.toLocaleString()}</div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as string | undefined;
      if (!updatedAt) return <div className="text-muted-foreground">-</div>;

      return (
        <div className="text-muted-foreground">
          {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const moduleItem = row.original;

      return (
        <div className="flex items-center justify-end space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {}}
            data-module-id={moduleItem.id}
            data-action="edit"
          >
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {}}
            data-module-id={moduleItem.id}
            data-action="delete"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      );
    },
  },
];
