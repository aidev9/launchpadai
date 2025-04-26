"use client";

import { Table } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  levelFilterAtom,
  searchFilterAtom,
  tagsFilterAtom,
} from "./courses-store";

import { Course } from "@/lib/firebase/courses";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

// Course levels
const courseLevels = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [levelFilter, setLevelFilter] = useAtom(levelFilterAtom);
  const [tagsFilter, setTagsFilter] = useAtom(tagsFilterAtom);

  // Get unique tags from all courses
  const uniqueTags = new Set<string>();
  table.getFilteredRowModel().rows.forEach((row) => {
    const tags = (row.original as unknown as Course).tags;
    if (tags && Array.isArray(tags)) {
      tags.forEach((tag) => uniqueTags.add(tag));
    }
  });

  // Convert to options format for the filter component
  const tagOptions = Array.from(uniqueTags)
    .sort()
    .map((tag) => ({
      label: tag,
      value: tag,
    }));

  // Check if any filters are active
  const isFiltered =
    searchFilter !== "" || levelFilter.length > 0 || tagsFilter.length > 0;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8"
            />
          </div>

          <DataTableFacetedFilter
            title="Level"
            options={courseLevels}
            value={levelFilter}
            onChange={setLevelFilter}
          />

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
                setLevelFilter([]);
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
