"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Table as TableIcon,
  Layers,
  MoreHorizontal,
  Trash2,
  Eye,
  Pencil,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { TechStack } from "@/lib/firebase/schema";
import { deleteTechStack } from "@/lib/firebase/techstacks";
import { FilterBar } from "@/components/ui/components/filter-bar";
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
  techStackWizardStateAtom,
  currentWizardStepAtom,
  isEditModeAtom,
  stackTableRowSelectionAtom,
  deleteMultipleTechStacksAtom as deleteMultipleTechStacksOptimisticAtom,
  deleteTechStackAtom as deleteTechStackOptimisticAtom,
} from "@/lib/store/techstack-store";
import { StackDataTable } from "./components/stack-data-table";
import { useCollectionData } from "react-firebase-hooks/firestore";
import FirebaseStacks, {
  firebaseStacks,
} from "@/lib/firebase/client/FirebaseStacks";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

const initialWizardState = {
  id: "",
  appType: "",
  frontEndStack: "",
  backEndStack: "",
  databaseStack: "",
  aiAgentStack: [],
  integrations: [],
  deploymentStack: "",
  name: "",
  description: "",
  tags: [],
  phases: [],
  prompt: "",
  documentationLinks: [],
  userId: "",
  productId: "",
};

export default function MyTechStacks() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView, setLayoutView] = useAtom(techStackLayoutViewAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(techStackPhaseFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(techStackSearchQueryAtom);
  const [, setSelectedTechStack] = useAtom(selectedTechStackAtom);
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

  // Use react-firebase-hooks to get tech stacks
  const [techStacks, isLoading, firestoreError] = useCollectionData(
    phaseFilter.length > 0
      ? firebaseStacks.getTechStacksByPhase(phaseFilter)
      : firebaseStacks.getTechStacks(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the data to include the document ID
  const formattedStacks = (techStacks || []).map((stack) => {
    // Firebase data comes with document ID in the __id field by default
    return {
      ...stack,
      id: stack.id,
    } as TechStack;
  });

  // Apply client-side search filter
  const filteredStacks =
    searchQuery.trim() === ""
      ? formattedStacks
      : formattedStacks.filter((stack) => {
          const query = searchQuery.toLowerCase();
          return (
            stack.name?.toLowerCase().includes(query) ||
            stack.description?.toLowerCase().includes(query) ||
            stack.tags?.some((tag) => tag.toLowerCase().includes(query))
          );
        });

  const handleCreateTechStack = () => {
    setSelectedTechStack(null);
    setTechStackWizardState(initialWizardState);
    setCurrentWizardStep(1);
    setIsEditMode(false);
    router.push("/mystacks/create");
  };

  const handleViewStack = (techStack: TechStack) => {
    setSelectedTechStack(techStack);
    router.push("/mystacks/stack");
  };

  const handleEditStack = (techStack: TechStack) => {
    setSelectedTechStack(techStack);
    setTechStackWizardState(techStack);
    setCurrentWizardStep(1);
    setIsEditMode(true);
    router.push("/mystacks/create");
  };

  const handleDeleteStack = async () => {
    if (!stackToDelete || !stackToDelete.id) return;
    const stackIdToDelete = stackToDelete.id;
    const result = await firebaseStacks.deleteTechStack(stackIdToDelete);
    if (result) {
      toast({
        title: "Success",
        description: "Tech stack deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete tech stack.",
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
    const deletePromises = selectedRows.map((rowId) => {
      const index = parseInt(rowId);
      const stackId = filteredStacks[index]?.id;
      return deleteTechStack(stackId);
    });
    // .filter((id): id is string => id !== null); // Type guard to ensure we only have strings

    const results = await Promise.all(deletePromises);
    toast({
      title: "Success",
      description: `${deletePromises.length} tech stack(s) deleted.`,
      duration: TOAST_DEFAULT_DURATION,
    });
    setRowSelection({});
    setIsDeleteSelectedDialogOpen(false);
  };

  const errorMessage = firestoreError
    ? firestoreError.message
    : "An error occurred";

  return (
    <>
      <Main>
        <Breadcrumbs
          items={[{ label: "My Tech Stacks" }]}
          className="mb-4"
          data-testid="breadcrumbs"
        />

        <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">Tech Stacks</h2>
            <p className="text-muted-foreground">
              Manage your tech stacks. Create references for your projects.
            </p>
          </div>

          <div className="flex space-x-2">
            {selectedRowCount > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteSelectedDialogOpen(true)}
                className="flex items-center gap-1"
                data-testid="delete-selected-button"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected</span>
              </Button>
            )}

            <Button
              onClick={handleCreateTechStack}
              className="flex items-center gap-1"
              data-testid="create-stack-button"
            >
              <Plus className="h-4 w-4" />
              <span>Create Stack</span>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          {/* FilterBar component */}
          <FilterBar
            mode="techstack"
            placeholderText="Filter stacks..."
            data-testid="stack-filter-bar"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !firestoreError && filteredStacks.length === 0 && (
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
          !firestoreError &&
          filteredStacks.length > 0 &&
          layoutView === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStacks.map((techStack) => (
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
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4 text-muted-foreground/70" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleEditStack(techStack);
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setStackToDelete(techStack);
                              // handleDeleteStack(techStack);
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
                            className="text-red-600 hover:!text-red-600 hover:!bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
                      {techStack.phases?.map((phase) => (
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
          !firestoreError &&
          filteredStacks.length > 0 &&
          layoutView === "table" && (
            <StackDataTable
              data={filteredStacks}
              onViewStack={handleViewStack}
              onEditStack={handleEditStack}
              onDeleteStack={setStackToDelete}
            />
          )}
      </Main>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!stackToDelete}
        onOpenChange={(open) => !open && setStackToDelete(null)}
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Confirmation Dialog */}
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
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
