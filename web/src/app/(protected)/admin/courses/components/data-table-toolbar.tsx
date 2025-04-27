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
import { useEffect, useState } from "react";

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
  const [allTagOptions, setAllTagOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Fetch all unique tags from the API when the component mounts
  useEffect(() => {
    async function fetchAllTags() {
      setIsLoadingTags(true);
      try {
        const response = await fetch("/api/courses/tags");
        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }
        const data = await response.json();

        // Convert to options format for the filter component
        const options = data.tags.map((tag: string) => ({
          label: tag,
          value: tag.toLowerCase(), // Store lowercase value for case-insensitive filtering
        }));

        setAllTagOptions(options);
      } catch (error) {
        console.error("Error fetching tags:", error);
        // Fallback to the old method if API fails
        fallbackToTableTags();
      } finally {
        setIsLoadingTags(false);
      }
    }

    fetchAllTags();
  }, []);

  // Fallback to getting tags from the table if API fails
  const fallbackToTableTags = () => {
    const uniqueTags = new Set<string>();
    table.getFilteredRowModel().rows.forEach((row) => {
      const tags = (row.original as unknown as Course).tags;
      if (tags && Array.isArray(tags)) {
        tags.forEach((tag) => uniqueTags.add(tag));
      }
    });

    const tagOptions = Array.from(uniqueTags)
      .sort()
      .map((tag) => ({
        label: tag,
        value: tag.toLowerCase(), // Store lowercase value for case-insensitive filtering
      }));

    setAllTagOptions(tagOptions);
  };

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
