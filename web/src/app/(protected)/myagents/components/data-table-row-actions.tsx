"use client";

import { Row } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Agent } from "@/lib/firebase/schema";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import {
  selectedAgentAtom,
  agentWizardStateAtom,
  currentWizardStepAtom,
  isEditModeAtom,
} from "@/lib/store/agent-store";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  data: Agent;
}

export function DataTableRowActions<TData>({
  row,
  data,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();
  const [, setSelectedAgent] = useAtom(selectedAgentAtom);
  const [, setAgentWizardState] = useAtom(agentWizardStateAtom);
  const [, setCurrentWizardStep] = useAtom(currentWizardStepAtom);
  const [, setIsEditMode] = useAtom(isEditModeAtom);

  const handleViewAgent = () => {
    setSelectedAgent(data);
    router.push("/myagents/agent");
  };

  const handleEditAgent = () => {
    setSelectedAgent(data);
    setAgentWizardState(data);
    setCurrentWizardStep(1);
    setIsEditMode(true);
    router.push("/myagents/create");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleViewAgent} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditAgent} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            // This will be handled by the parent component
            document.dispatchEvent(
              new CustomEvent("delete-agent", { detail: data })
            );
          }}
          className="text-red-600 hover:!text-red-600 hover:!bg-red-50 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
