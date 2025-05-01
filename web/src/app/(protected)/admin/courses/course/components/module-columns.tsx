"use client";

import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Module } from "@/lib/firebase/schema";
import { DataTableColumnHeader } from "./data-table/data-table-column-header";
import { DataTableRowActions } from "./data-table/data-table-row-actions";

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
    meta: {
      className: cn(
        "sticky md:table-cell left-0 z-10 rounded-tl",
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(e) => e.stopPropagation()} // Prevent row click event
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Module Name" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("title")}</div>;
    },
    meta: {
      className: "min-w-[180px] lg:w-[300px]",
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
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="secondary" className="capitalize">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      if (!tags || !Array.isArray(tags)) return false;

      // Case-insensitive comparison
      const lowerCaseTags = tags.map((tag) => tag.toLowerCase());
      return value.some((v) => lowerCaseTags.includes(v.toLowerCase()));
    },
  },
  {
    accessorKey: "xpAwards",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="XP" />
    ),
    cell: ({ row }) => {
      const xpAwards = row.getValue("xpAwards") as number;
      return <div className="font-medium">{xpAwards || 0}</div>;
    },
    meta: { className: "w-24" },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
