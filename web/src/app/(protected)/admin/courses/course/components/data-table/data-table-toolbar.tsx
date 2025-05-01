"use client";

import { Table } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchFilterAtom, tagsFilterAtom } from "../modules-store";

import { Module } from "@/lib/firebase/schema";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import { useEffect, useState } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [tagsFilter, setTagsFilter] = useAtom(tagsFilterAtom);

  // Track all available tags from modules
  const [allTagOptions, setAllTagOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  // Get unique tags from all modules
  useEffect(() => {
    const data = table.getCoreRowModel().rows;
    const tagSet = new Set<string>();

    // Collect all unique tags
    data.forEach((row) => {
      const rowData = row.original as unknown as Module;
      if (rowData.tags && Array.isArray(rowData.tags)) {
        rowData.tags.forEach((tag) => tagSet.add(tag.toLowerCase()));
      }
    });

    // Convert to the format needed for the faceted filter
    const tagOptions = Array.from(tagSet).map((tag) => ({
      label: tag.charAt(0).toUpperCase() + tag.slice(1), // Capitalize first letter
      value: tag.toLowerCase(),
    }));

    // Sort alphabetically
    tagOptions.sort((a, b) => a.label.localeCompare(b.label));

    setAllTagOptions(tagOptions);
  }, [table]);

  // Check if any filters are active
  const isFiltered = searchFilter !== "" || tagsFilter.length > 0;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          {allTagOptions.length > 0 && (
            <DataTableFacetedFilter
              title="Tags"
              options={allTagOptions}
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
