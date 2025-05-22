"use client";

import { Table } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { searchFilterAtom, tagsFilterAtom } from "./notes-store";
import {
  DataTableFacetedFilter,
  OptionType,
} from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [tagsFilter, setTagsFilter] = useAtom(tagsFilterAtom);

  // Get unique tags from all rows
  const uniqueTags = new Set<string>();
  table.getFilteredRowModel().rows.forEach((row) => {
    const tags = row.getValue("tags") as string[];
    if (tags && Array.isArray(tags)) {
      tags.forEach((tag) => uniqueTags.add(tag));
    }
  });

  // Convert to options format for the filter component
  const tagOptions: OptionType[] = Array.from(uniqueTags)
    .sort()
    .map((tag) => ({
      label: tag,
      value: tag,
    }));

  // Sync filters with column filters when component mounts or filters change
  const isFiltered = searchFilter.trim() !== "" || tagsFilter.length > 0;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter notes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          {tagOptions.length > 0 && (
            <DataTableFacetedFilter
              title="Tags"
              options={tagOptions}
              value={tagsFilter}
              onChange={setTagsFilter}
            />
          )}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchFilter("");
                setTagsFilter([]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
