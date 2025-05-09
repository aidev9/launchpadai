"use client";

import { ColumnDef } from "@tanstack/react-table";
import { FeedbackTableMeta } from "./table-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Feedback } from "@/lib/firebase/schema";
import { format } from "date-fns";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

// Type badge colors
const typeColors = new Map([
  ["bug", "bg-red-600 text-white hover:bg-red-700"],
  ["feature", "bg-blue-600 text-white hover:bg-blue-700"],
  ["comment", "bg-green-600 text-white hover:bg-green-700"],
]);

// Status badge colors
const statusColors = new Map([
  ["new", "bg-yellow-600 text-white hover:bg-yellow-700"],
  ["in-progress", "bg-purple-600 text-white hover:bg-purple-700"],
  ["resolved", "bg-green-600 text-white hover:bg-green-700"],
]);

export const columns: ColumnDef<Feedback>[] = [
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
    accessorKey: "subject",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subject" />
    ),
    cell: ({ row }) => {
      const subject = row.getValue("subject") as string;
      return <div className="font-medium">{subject}</div>;
    },
    meta: {
      className: "min-w-[180px] lg:w-[300px]",
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const badgeColor = typeColors.get(type) || "";

      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={cn("capitalize", badgeColor)}>
            {type}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const badgeColor = statusColors.get(status) || "";

      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={cn("capitalize", badgeColor)}>
            {status}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const email = row.original.userEmail;

      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      const date = createdAt ? new Date(createdAt) : null;

      return (
        <div className="text-sm text-muted-foreground">
          {date ? format(date, "MMM d, yyyy") : "N/A"}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as FeedbackTableMeta;
      return <DataTableRowActions row={row} onRespond={meta.onRespond} />;
    },
    meta: {
      className: "text-right",
    },
  },
];
