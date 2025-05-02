import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus } from "lucide-react";

interface EmptyStateProps {
  setPromptModalOpen: (open: boolean) => void;
}

export function EmptyState({ setPromptModalOpen }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-8 text-xl font-semibold">No prompts created</h3>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        You haven't created any prompts yet. Add one below.
      </p>
      <Button onClick={() => setPromptModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Prompt
      </Button>
    </div>
  );
}
