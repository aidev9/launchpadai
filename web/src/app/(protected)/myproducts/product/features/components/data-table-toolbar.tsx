"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import {
  featureTableRowSelectionAtom,
  featureWizardStateAtom,
} from "@/lib/store/feature-store";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { deleteFeature } from "@/lib/firebase/features";
import { useToast } from "@/hooks/use-toast";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [rowSelection, setRowSelection] = useAtom(featureTableRowSelectionAtom);
  const [featureWizardState] = useAtom(featureWizardStateAtom);
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const { toast } = useToast();

  // Get the product ID from Jotai atoms
  const productId = featureWizardState.productId || selectedProductId;

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!productId) return;

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => (row.original as any).id);

    try {
      // This is a placeholder for the actual bulk delete functionality
      // In a real implementation, you would call a server action to delete multiple features
      for (const id of selectedIds) {
        await deleteFeature(id, productId);
      }

      toast({
        title: "Success",
        description: `${selectedIds.length} features deleted successfully.`,
      });

      // Clear selection
      setRowSelection({});

      // Refresh the table (this would typically be handled by revalidating the path)
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete features",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter features..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={[
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
              { label: "Under Development", value: "Under Development" },
            ]}
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
        {Object.keys(rowSelection).length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="h-8"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
