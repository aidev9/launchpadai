"use client";

import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import LongText from "@/components/long-text";
import { statusTypes } from "../data/data";
import { Question } from "@/lib/firebase/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { formatTimestamp } from "@/utils/constants";
import { formatDistance } from "date-fns";

export const columns: ColumnDef<Question>[] = [
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
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
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
    accessorKey: "question",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Question" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-64">{row.getValue("question")}</LongText>
    ),
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
        "sticky left-6 md:table-cell"
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "phase",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phase" />
    ),
    cell: ({ row }) => {
      const phases = row.original.phases;
      const phase =
        phases && phases.length > 0 ? phases[0] : row.getValue("phase");

      return phase ? (
        <Badge variant="outline" className="capitalize">
          {String(phase)}
        </Badge>
      ) : (
        <div className="text-muted-foreground italic">N/A</div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const phases = row.original.phases;
      const phase =
        phases && phases.length > 0 ? phases[0] : row.getValue("phase");

      return value.includes(phase);
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const { answer } = row.original;
      let status = "unanswered";

      if (answer) {
        status = "answered";
      }

      const badgeColor = statusTypes.get(status);

      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={cn("capitalize", badgeColor)}>
            {status}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const { answer } = row.original;
      let status = "unanswered";

      if (answer) {
        status = "answered";
      }

      return value.includes(status);
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
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const question = row.original;
      // Use the timestamp directly if available, otherwise fallback to current time
      let timestamp = question.updatedAt || Date.now();

      // Handle string timestamps by converting to number
      if (typeof timestamp === "string") {
        timestamp = parseInt(timestamp, 10);
      }

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
    sortingFn: "datetime",
  },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];
