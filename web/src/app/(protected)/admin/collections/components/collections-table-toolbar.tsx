"use client";

import { useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { Collection } from "../../types/admin-types";
import {
  searchFilterAtom,
  statusFilterAtom,
  userIdFilterAtom,
} from "../collections-store";
import { useAtom } from "jotai";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

// Status options
const statusOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

interface CollectionsTableToolbarProps {
  table: Table<Collection>;
  onRefresh?: () => Promise<void>;
}

export function CollectionsTableToolbar({
  table,
  onRefresh,
}: CollectionsTableToolbarProps) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);
  const [userIdFilter, setUserIdFilter] = useAtom(userIdFilterAtom);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle global search filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchFilter(value);
    table.setGlobalFilter(value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchFilter("");
    setStatusFilter([]);
    setUserIdFilter([]);

    // Reset column filters
    table.getAllColumns().forEach((column) => {
      if (column.getCanFilter()) {
        column.setFilterValue(undefined);
      }
    });

    // Reset global filter
    table.setGlobalFilter("");
  };

  const isFiltered =
    searchFilter !== "" || statusFilter.length > 0 || userIdFilter.length > 0;

  // Get unique user IDs for filter options
  const uniqueUserIds = Array.from(
    new Set(
      table
        .getPreFilteredRowModel()
        .rows.map((row) => row.original.userId)
        .filter(Boolean)
    )
  ).map((userId) => ({
    label: userId,
    value: userId,
  }));

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchFilter}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>

          <DataTableFacetedFilter
            title="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(value: string[]) => {
              setStatusFilter(value);
              table
                .getColumn("isPublic")
                ?.setFilterValue(value.length ? value : undefined);
            }}
          />

          {uniqueUserIds.length > 0 && (
            <DataTableFacetedFilter
              title="User ID"
              options={uniqueUserIds}
              value={userIdFilter}
              onChange={(value: string[]) => {
                setUserIdFilter(value);
                table
                  .getColumn("userId")
                  ?.setFilterValue(value.length ? value : undefined);
              }}
            />
          )}

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              if (onRefresh) {
                setIsRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setIsRefreshing(false);
                }
              }
            }}
            disabled={isRefreshing}
            className="h-8 w-8"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  );
}
