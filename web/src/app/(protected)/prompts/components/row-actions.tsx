"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy } from "lucide-react";
import { Prompt } from "@/lib/firebase/schema";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onUseAsTemplate?: (prompt: Prompt) => void;
}

export function DataTableRowActions<TData>({
  row,
  onUseAsTemplate,
}: DataTableRowActionsProps<TData>) {
  const prompt = row.original as Prompt;

  // This handler function needs to completely stop event propagation
  const handleUseAsTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUseAsTemplate && prompt) {
      onUseAsTemplate(prompt);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {onUseAsTemplate && (
          <DropdownMenuItem
            onClick={handleUseAsTemplate}
            onSelect={(e) => e.preventDefault()}
          >
            <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Use As Template
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
