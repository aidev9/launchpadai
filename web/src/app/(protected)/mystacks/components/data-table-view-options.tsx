"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAtom } from "jotai";
// Use the atom for stack table column visibility
import { stackTableColumnVisibilityAtom } from "@/lib/store/techstack-store";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  // Use the Jotai atom for stack table column visibility
  const [, setColumnVisibility] = useAtom(stackTableColumnVisibilityAtom);

  // Apply stored visibility to the table on initial render or when atom changes
  // This useEffect was missing in the prompts version but is good practice for syncing atom to table state.
  // However, TanStack Table typically manages its own state internally once initialized.
  // The primary role of the atom here is for PERSISTENCE.
  // The table's internal state is updated directly by onCheckedChange.
  // For now, we'll keep it simple and let the onCheckedChange handler update the atom,
  // and assume the table initializes with default visibility unless configured otherwise.

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-8 lg:flex">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            // Friendly names for columns
            let displayName = column.id;
            if (column.id === "appType") displayName = "App Type";
            if (column.id === "frontEndStack") displayName = "Frontend";
            if (column.id === "backendStack") displayName = "Backend";
            // Add more friendly names as needed

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => {
                  column.toggleVisibility(!!value);
                  // Update the atom state for persistence
                  setColumnVisibility((prev) => ({
                    ...prev,
                    [column.id]: !!value,
                  }));
                }}
              >
                {displayName}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
