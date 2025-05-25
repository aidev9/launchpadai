"use client";

import { useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { UserProfile } from "@/lib/firebase/schema";
import {
  searchFilterAtom,
  userTypeFilterAtom,
  subscriptionFilterAtom,
} from "../users-store";
import { useAtom } from "jotai";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableViewOptions } from "./data-table-view-options";

// User types
const userTypes = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "superadmin" },
];

// Subscription levels
const subscriptionLevels = [
  { label: "Free", value: "free" },
  { label: "Explorer", value: "explorer" },
  { label: "Builder", value: "builder" },
  { label: "Accelerator", value: "accelerator" },
];

interface UsersTableToolbarProps {
  table: Table<UserProfile>;
  onRefresh?: () => Promise<void>;
}

export function UsersTableToolbar({
  table,
  onRefresh,
}: UsersTableToolbarProps) {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const [userTypeFilter, setUserTypeFilter] = useAtom(userTypeFilterAtom);
  const [subscriptionFilter, setSubscriptionFilter] = useAtom(
    subscriptionFilterAtom
  );
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
    setUserTypeFilter([]);
    setSubscriptionFilter([]);

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
    searchFilter !== "" ||
    userTypeFilter.length > 0 ||
    subscriptionFilter.length > 0;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchFilter}
              onChange={handleSearchChange}
              className="pl-8"
            />
          </div>

          <DataTableFacetedFilter
            title="User Type"
            options={userTypes}
            value={userTypeFilter}
            onChange={(value) => {
              setUserTypeFilter(value);
              table
                .getColumn("userType")
                ?.setFilterValue(value.length ? value : undefined);
            }}
          />

          <DataTableFacetedFilter
            title="Subscription"
            options={subscriptionLevels}
            value={subscriptionFilter}
            onChange={(value) => {
              setSubscriptionFilter(value);
              table
                .getColumn("subscription")
                ?.setFilterValue(value.length ? value : undefined);
            }}
          />

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
