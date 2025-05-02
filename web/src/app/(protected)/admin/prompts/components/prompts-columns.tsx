import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Prompt } from "@/lib/firebase/schema";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import Link from "next/link";
import { useSetAtom } from "jotai";
import {
  promptModalOpenAtom,
  promptActionAtom,
  editedPromptAtom,
} from "@/lib/store/prompt-store";
import { deletePromptAction } from "@/lib/firebase/actions/prompts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import LongText from "@/components/long-text";

// This function will be called to render each cell in the "actions" column
function ActionsCell({ row }: { row: any }) {
  const prompt = row.original;
  const setAddPromptModalOpen = useSetAtom(promptModalOpenAtom);
  const setPromptAction = useSetAtom(promptActionAtom);
  const setPromptToEdit = useSetAtom(editedPromptAtom);
  const { toast } = useToast();

  const handleEdit = () => {
    // Set the prompt to edit and open the modal
    setPromptToEdit(prompt);
    setAddPromptModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${prompt.title}"?`)) {
      return;
    }

    try {
      // Use the server action for deletion
      const result = await deletePromptAction(prompt.id);
      if (result.success) {
        setPromptAction({
          type: "DELETE",
          promptId: prompt.id,
        });

        toast({
          title: "Prompt deleted",
          description: "The prompt has been deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete prompt",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/prompts/${prompt.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-500 hover:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Prompt>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    meta: {
      className: cn(
        "sticky md:table-cell left-0 z-10 rounded-tl",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-64">{row.getValue("title")}</LongText>
    ),
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none",
        "bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
        "sticky left-6 md:table-cell"
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "phaseTags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phases" />
    ),
    cell: ({ row }) => {
      const phases = row.getValue("phaseTags") as string[];

      if (!phases || phases.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {phases.map((phase) => (
            <Badge
              key={phase}
              variant="secondary"
              className={getPhaseColor(phase)}
            >
              {phase}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const phases = row.getValue(id) as string[];
      return value.some((val: string) => phases.includes(val));
    },
  },
  {
    accessorKey: "productTags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Products" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("productTags") as string[];

      if (!tags || tags.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];

      if (!tags || tags.length === 0) {
        return <div className="text-muted-foreground italic">None</div>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="bg-muted">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="bg-muted">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // If value is null or empty array, don't filter
      if (!value || !Array.isArray(value) || value.length === 0) {
        return true;
      }

      const tags = row.getValue(id) as string[];
      return value.some((val: string) => tags.includes(val));
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Modified" />
    ),
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as {
        seconds: number;
        nanoseconds: number;
      };
      const date = updatedAt ? new Date(updatedAt.seconds * 1000) : null;

      return (
        <div className="text-sm text-muted-foreground">
          {date ? date.toLocaleDateString() : "N/A"}
        </div>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId) as {
        seconds: number;
        nanoseconds: number;
      };
      const b = rowB.getValue(columnId) as {
        seconds: number;
        nanoseconds: number;
      };

      if (!a || !b) return 0;

      return a.seconds > b.seconds ? 1 : a.seconds < b.seconds ? -1 : 0;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
