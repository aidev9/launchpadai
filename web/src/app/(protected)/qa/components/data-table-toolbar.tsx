"use client";

import { Table } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cross2Icon } from "@radix-ui/react-icons";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { statusTypes } from "../data/data";
import { phaseOptions } from "../data/data";
import {
  searchQueryAtom,
  statusFilterAtom,
  tagsFilterAtom,
  questionsPhaseFilterAtom,
} from "./qa-store";
import { Phases } from "@/lib/firebase/schema";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);
  const [tagsFilter, setTagsFilter] = useAtom(tagsFilterAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(questionsPhaseFilterAtom);

  // Get unique tags from all rows
  const uniqueTags = new Set<string>();
  table.getFilteredRowModel().rows.forEach((row) => {
    const tags = row.getValue("tags") as string[];
    if (tags) {
      tags.forEach((tag) => uniqueTags.add(tag));
    }
  });

  const tagOptions = Array.from(uniqueTags)
    .sort()
    .map((tag) => ({
      label: tag,
      value: tag,
    }));

  // Convert status options
  const statusOptions = Array.from(statusTypes.keys()).map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
  }));

  // Convert phase options to use Phases enum
  const phaseOptionsMapped = phaseOptions.map((phase) => ({
    label: phase,
    value: phase as Phases,
  }));

  const handlePhaseFilterChange = (values: string[]) => {
    setPhaseFilter(values.map((value) => value as Phases));
  };

  const isFiltered =
    statusFilter.length > 0 ||
    tagsFilter.length > 0 ||
    phaseFilter.length > 0 ||
    searchQuery.trim() !== "";

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {statusOptions.length > 0 && (
            <DataTableFacetedFilter
              title="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          )}

          {phaseOptionsMapped.length > 0 && (
            <DataTableFacetedFilter
              title="Phase"
              options={phaseOptionsMapped}
              value={phaseFilter as string[]}
              onChange={handlePhaseFilterChange}
            />
          )}

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
                setSearchQuery("");
                setStatusFilter([]);
                setTagsFilter([]);
                setPhaseFilter([]);
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
