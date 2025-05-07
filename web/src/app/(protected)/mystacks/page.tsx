"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Layers,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { useAtom, useAtomValue } from "jotai";
import { TechStack } from "@/lib/firebase/schema";
import {
  getAllTechStacks,
  deleteTechStack,
  deleteMultipleTechStacks,
} from "@/lib/firebase/techstacks";
import { PhaseFilter } from "@/components/prompts/phase-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  techStackLayoutViewAtom,
  techStackPhaseFilterAtom,
  techStackSearchQueryAtom,
  selectedTechStackAtom,
  selectedTechStackIdAtom,
  techStackWizardStateAtom,
  currentWizardStepAtom,
  isEditModeAtom,
  stackTableRowSelectionAtom,
  deleteMultipleTechStacksAtom as deleteMultipleTechStacksOptimisticAtom,
  deleteTechStackAtom as deleteTechStackOptimisticAtom,
  allTechStacksAtom,
  filteredTechStacksAtom,
  techStacksLoadingAtom,
  techStacksErrorAtom,
} from "@/lib/store/techstack-store";
import { StackDataTable } from "./components/stack-data-table";

const initialWizardState = {
  appType: "",
  frontEndStack: "",
  backendStack: "",
  database: "",
  aiAgentStack: [],
  integrations: [],
  deploymentStack: "",
  name: "",
  description: "",
  tags: [],
  phase: [],
  prompt: "",
  documentationLinks: [],
};

export default function MyTechStacks() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView, setLayoutView] = useAtom(techStackLayoutViewAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(techStackPhaseFilterAtom);
  const [_searchQuery, setSearchQuery] = useAtom(techStackSearchQueryAtom);
  const [, setSelectedTechStack] = useAtom(selectedTechStackAtom);
  const [, setSelectedTechStackId] = useAtom(selectedTechStackIdAtom);
  const [, setTechStackWizardState] = useAtom(techStackWizardStateAtom);
  const [, setCurrentWizardStep] = useAtom(currentWizardStepAtom);
  const [, setIsEditMode] = useAtom(isEditModeAtom);
  const [rowSelection, setRowSelection] = useAtom(stackTableRowSelectionAtom);
  const [, optimisticDeleteMultiple] = useAtom(
    deleteMultipleTechStacksOptimisticAtom
  );
  const [, optimisticDeleteSingle] = useAtom(deleteTechStackOptimisticAtom);
  const [isDeleteSelectedDialogOpen, setIsDeleteSelectedDialogOpen] =
    useState(false);
  const [stackToDelete, setStackToDelete] = useState<TechStack | null>(null);

  const filteredStacksData = useAtomValue(filteredTechStacksAtom);
  const isLoading = useAtomValue(techStacksLoadingAtom);
  const error = useAtomValue(techStacksErrorAtom);

  const [, setAllTechStacks] = useAtom(allTechStacksAtom);
  const [, setIsLoading] = useAtom(techStacksLoadingAtom);
  const [, setError] = useAtom(techStacksErrorAtom);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getAllTechStacks();
        if (result.success && result.techStacks) {
          setAllTechStacks(result.techStacks);
        } else {
          setError(result.error || "Failed to fetch tech stacks");
        }
      } catch (errorMsg) {
        setError(
          errorMsg instanceof Error
            ? errorMsg.message
            : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setAllTechStacks, setIsLoading, setError]);

  const handleCreateTechStack = () => {
    setSelectedTechStackId(null);
    setSelectedTechStack(null);
    setTechStackWizardState(initialWizardState);
    setCurrentWizardStep(1);
    setIsEditMode(false);
    router.push("/mystacks/create");
  };

  const handleViewStack = (techStack: TechStack) => {
    setSelectedTechStackId(techStack.id ?? null);
    setSelectedTechStack(techStack);
    router.push("/mystacks/stack");
  };

  const handleEditStack = (techStack: TechStack) => {
    setSelectedTechStackId(techStack.id ?? null);
    setSelectedTechStack(techStack);
    setTechStackWizardState({
      appType: techStack.appType || "",
      frontEndStack: techStack.frontEndStack || "",
      backendStack: techStack.backendStack || "",
      database: techStack.database || "",
      aiAgentStack: techStack.aiAgentStack || [],
      integrations: techStack.integrations || [],
      deploymentStack: techStack.deploymentStack || "",
      name: techStack.name || "",
      description: techStack.description || "",
      tags: techStack.tags || [],
      phase: techStack.phase || [],
      prompt: techStack.prompt || "",
      documentationLinks: techStack.documentationLinks || [],
    });
    setCurrentWizardStep(1);
    setIsEditMode(true);
    router.push("/mystacks/create");
  };

  const handleDeleteStack = async () => {
    if (!stackToDelete || !stackToDelete.id) return;
    const stackIdToDelete = stackToDelete.id;
    const stackNameToDelete = stackToDelete.name;
    setStackToDelete(null);

    optimisticDeleteSingle(stackIdToDelete);

    const result = await deleteTechStack(stackIdToDelete);
    if (result.success) {
      toast({
        title: "Success",
        description: `Tech stack "${stackNameToDelete}" deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description:
          result.error || `Failed to delete tech stack "${stackNameToDelete}".`,
        variant: "destructive",
      });
    }
  };

  const selectedRowCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  ).length;

  const handleDeleteSelectedStacks = async () => {
    const selectedRows = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );

    if (selectedRows.length === 0) {
      toast({ title: "No stacks selected", variant: "destructive" });
      return;
    }

    // Map the selected row indices to actual tech stack IDs
    // In TanStack Table, the row IDs are string representations of array indices
    const selectedIds: string[] = selectedRows
      .map((rowId) => {
        const index = parseInt(rowId);
        const stackId = filteredStacksData[index]?.id;
        return typeof stackId === "string" ? stackId : null;
      })
      .filter((id): id is string => id !== null); // Type guard to ensure we only have strings

    if (selectedIds.length === 0) {
      toast({
        title: "Error identifying selected stacks",
        variant: "destructive",
      });
      return;
    }

    optimisticDeleteMultiple(selectedIds);

    const result = await deleteMultipleTechStacks(selectedIds);
    if (result.success) {
      toast({
        title: "Success",
        description: `${selectedIds.length} tech stack(s) deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete selected tech stacks.",
        variant: "destructive",
      });
    }
    setRowSelection({});
    setIsDeleteSelectedDialogOpen(false);
  };

  const _clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "My Tech Stacks", isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">My Tech Stacks</h1>
          <div className="flex flex-wrap gap-2">
            {selectedRowCount > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteSelectedDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedRowCount})
              </Button>
            )}
            <Button onClick={handleCreateTechStack}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Tech Stack
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="w-full md:flex-1 overflow-x-auto pb-2">
            <div className="inline-flex md:flex flex-nowrap md:flex-wrap">
              <PhaseFilter
                selectedPhases={phaseFilter}
                onChange={setPhaseFilter}
              />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex border rounded-md">
              <Button
                variant={layoutView === "card" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("card")}
                className="rounded-r-none"
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layoutView === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("table")}
                className="rounded-l-none"
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredStacksData.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">No tech stacks found</h2>
            <p className="text-muted-foreground mt-2">
              Create a new tech stack to get started
            </p>
            <Button
              onClick={handleCreateTechStack}
              variant="outline"
              className="mt-4"
            >
              Create Tech Stack
            </Button>
          </div>
        )}

        {/* Tech stack cards grid */}
        {!isLoading &&
          !error &&
          filteredStacksData.length > 0 &&
          layoutView === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStacksData.map((techStack) => (
                <div
                  key={techStack.id}
                  className="border border-primary/20 rounded-md overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer hover:bg-accent min-h-48"
                  onClick={() => handleViewStack(techStack)}
                >
                  <div className="p-4 relative flex-grow">
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleViewStack(techStack);
                            }}
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleEditStack(techStack);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setStackToDelete(techStack);
                              // Close the dropdown menu
                              const dropdownTrigger = e.currentTarget.closest(
                                '[data-state="open"]'
                              );
                              if (dropdownTrigger) {
                                const closeEvent = new Event("keydown");
                                Object.defineProperty(closeEvent, "keyCode", {
                                  value: 27,
                                });
                                dropdownTrigger.dispatchEvent(closeEvent);
                              }
                            }}
                            className="text-red-600 hover:!text-red-600 hover:!bg-red-50"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-start mb-2 pr-10">
                      <Layers className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                      <h3 className="font-semibold text-md leading-tight">
                        {techStack.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-4 mt-1 mb-2">
                      {techStack.description || "No description"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t">
                      {techStack.phase.map((phase) => (
                        <span
                          key={phase}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {phase}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
                      <div>{techStack.appType}</div>
                      <div>{techStack.frontEndStack}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Tanstack Table view */}
        {!isLoading &&
          !error &&
          filteredStacksData.length > 0 &&
          layoutView === "table" && (
            <StackDataTable
              data={filteredStacksData}
              onViewStack={handleViewStack}
              onEditStack={handleEditStack}
              onDeleteStack={setStackToDelete}
            />
          )}
      </div>

      {/* Delete Confirmation Dialog (existing) */}
      {stackToDelete && (
        <AlertDialog
          open={!!stackToDelete}
          onOpenChange={() => setStackToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                tech stack.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStackToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStack}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Selected Confirmation Dialog - NEW */}
      <AlertDialog
        open={isDeleteSelectedDialogOpen}
        onOpenChange={setIsDeleteSelectedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected {selectedRowCount} tech stack(s) and all their associated
              assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelectedStacks}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Main>
  );
}
