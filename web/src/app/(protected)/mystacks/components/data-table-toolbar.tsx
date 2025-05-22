"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Search, X } from "lucide-react";
import { phaseOptions } from "@/utils/constants";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  // We are not including specific filter inputs here for now,
  // as global search and phase filters are handled on the main page.
  // This toolbar will primarily host view options and potentially future column-specific filters.
  // Add global filter state and setter if managed outside
  // globalFilter: string;
  // setGlobalFilter: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  // Get global filter value directly from table state
  const globalFilter = table.getState().globalFilter;

  // State for dynamic tags if needed (similar to prompts example)
  // const [allTags, setAllTags] = useState<string[]>([]);
  // useEffect(() => {
  //   const data = table.getFilteredRowModel().flatRows.map((row) => row.original as any);
  //   const uniqueTags = new Set<string>();
  //   data.forEach((item: any) => {
  //     if (item.tags && Array.isArray(item.tags)) {
  //       item.tags.forEach((tag: string) => uniqueTags.add(tag));
  //     }
  //   });
  //   setAllTags(Array.from(uniqueTags));
  // }, [table.getFilteredRowModel().flatRows]);
  // const tagOptions = allTags.map((tag) => ({ label: tag, value: tag }));

  // Note: The global search and phase pills are currently outside this toolbar.
  // If we want them inside, we need to read/write the corresponding atoms here.
  // For now, focusing on adding faceted filters for columns.

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-1 items-center space-x-2">
        {/* Table Search Input */}
        <div className="relative flex-1 max-w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter stacks..." // Changed placeholder
            value={(globalFilter as string) ?? ""}
            onChange={
              (event) => table.setGlobalFilter(event.target.value) // Use table's setter
            }
            className="pl-8"
          />
          {globalFilter && (
            <button
              onClick={() => table.setGlobalFilter("")} // Clear filter
              className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Faceted Filters */}
        {table.getColumn("phase") && (
          <DataTableFacetedFilter
            column={table.getColumn("phase")}
            title="Phase"
            options={phaseOptions} // Make sure phaseOptions is correctly defined/imported
          />
        )}
        {/* {table.getColumn("tags") && tagOptions.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("tags")}
            title="Tags"
            options={tagOptions}
          />
        )} */}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset Filters
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
