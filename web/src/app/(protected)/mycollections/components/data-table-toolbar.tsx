"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/app/(protected)/myprompts/components/data-table-view-options";
import { DataTableFacetedFilter } from "@/app/(protected)/myprompts/components/data-table-faceted-filter";
import { CollectionStatus } from "@/lib/firebase/schema";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const statusOptions = [
    { label: "Uploading", value: "uploading" },
    { label: "Uploaded", value: "uploaded" },
    { label: "Indexing", value: "indexing" },
    { label: "Indexed", value: "indexed" },
    { label: "Reindexing", value: "reindexing" },
  ];

  const phaseOptions = [
    { label: "Discover", value: "Discover" },
    { label: "Validate", value: "Validate" },
    { label: "Design", value: "Design" },
    { label: "Build", value: "Build" },
    { label: "Secure", value: "Secure" },
    { label: "Launch", value: "Launch" },
    { label: "Grow", value: "Grow" },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statusOptions}
          />
        )}
        {table.getColumn("phaseTags") && (
          <DataTableFacetedFilter
            column={table.getColumn("phaseTags")}
            title="Phase"
            options={phaseOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
