"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Plus, Bot, MoreHorizontal, Trash2, Eye, Pencil } from "lucide-react";
import { AgentDataTable } from "./components/agent-data-table";
import { StatusToggle } from "./components/status-toggle";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { useAtom } from "jotai";
import { Agent, Phases } from "@/lib/firebase/schema";
import { FilterBar } from "@/components/ui/components/filter-bar";
import { ErrorDisplay } from "@/components/ui/error-display";
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
  agentLayoutViewAtom,
  agentPhaseFilterAtom,
  agentSearchQueryAtom,
  selectedAgentAtom,
  agentWizardStateAtom,
  currentWizardStepAtom,
  isEditModeAtom,
  agentTableRowSelectionAtom,
  deleteMultipleAgentsAtom,
  deleteAgentAtom,
} from "@/lib/store/agent-store";
import { selectedProductAtom } from "@/lib/store/product-store";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAgents } from "@/lib/firebase/client/FirebaseAgents";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import {
  AgentGridSkeleton,
  AgentTableSkeleton,
} from "./components/agent-skeleton";

const initialWizardState = {
  id: "",
  userId: "",
  productId: "",
  name: "",
  description: "",
  phases: [],
  tags: [],
  collections: [],
  tools: [],
  mcpEndpoints: [],
  a2aEndpoints: [],
  configuration: {
    url: "",
    apiKey: "",
    rateLimitPerMinute: 60,
    allowedIps: [],
    isEnabled: false,
  },
};

export default function MyAgents() {
  const router = useRouter();
  const { toast } = useToast();
  const [layoutView, setLayoutView] = useAtom(agentLayoutViewAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(agentPhaseFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(agentSearchQueryAtom);
  const [, setSelectedAgent] = useAtom(selectedAgentAtom);
  const [, setAgentWizardState] = useAtom(agentWizardStateAtom);
  const [, setCurrentWizardStep] = useAtom(currentWizardStepAtom);
  const [, setIsEditMode] = useAtom(isEditModeAtom);
  const [rowSelection, setRowSelection] = useAtom(agentTableRowSelectionAtom);
  const [, optimisticDeleteMultiple] = useAtom(deleteMultipleAgentsAtom);
  const [, optimisticDeleteSingle] = useAtom(deleteAgentAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [isDeleteSelectedDialogOpen, setIsDeleteSelectedDialogOpen] =
    useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Use react-firebase-hooks to get agents
  const [agents, isLoading, firestoreError] = useCollectionData(
    selectedProduct?.id
      ? phaseFilter.length > 0
        ? firebaseAgents.getAgentsByPhase(
            phaseFilter as unknown as Phases[],
            selectedProduct.id
          )
        : firebaseAgents.getAgents(selectedProduct.id)
      : null, // Don't query if no product is selected
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the data to include the document ID
  const formattedAgents = (agents || []).map((agent) => {
    return {
      ...agent,
      id: agent.id,
    } as Agent;
  });

  // Apply client-side search filter
  const filteredAgents =
    searchQuery.trim() === ""
      ? formattedAgents
      : formattedAgents.filter((agent) => {
          const query = searchQuery.toLowerCase();
          return (
            agent.name?.toLowerCase().includes(query) ||
            agent.description?.toLowerCase().includes(query) ||
            agent.tags?.some((tag) => tag.toLowerCase().includes(query))
          );
        });

  const handleCreateAgent = () => {
    if (!selectedProduct?.id) {
      toast({
        title: "No product selected",
        description: "Please select a product before creating an agent.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAgent(null);
    setAgentWizardState({
      ...initialWizardState,
      productId: selectedProduct.id,
    });
    setCurrentWizardStep(1);
    setIsEditMode(false);
    router.push("/myagents/create");
  };

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    router.push("/myagents/agent");
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentWizardState(agent);
    setCurrentWizardStep(1);
    setIsEditMode(true);
    router.push("/myagents/create");
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete || !agentToDelete.id) return;
    const agentIdToDelete = agentToDelete.id;
    const result = await firebaseAgents.deleteAgent(agentIdToDelete);
    if (result) {
      toast({
        title: "Success",
        description: "Agent deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete agent.",
        variant: "destructive",
      });
    }
    setAgentToDelete(null);
  };

  const selectedRowCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  ).length;

  const handleDeleteSelectedAgents = async () => {
    const selectedRows = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );

    if (selectedRows.length === 0) {
      toast({ title: "No agents selected", variant: "destructive" });
      return;
    }

    // Map the selected row indices to actual agent IDs
    const agentIds = selectedRows
      .map((rowId) => {
        const index = parseInt(rowId);
        return filteredAgents[index]?.id;
      })
      .filter(Boolean) as string[];

    const result = await optimisticDeleteMultiple(agentIds);

    if (result.success) {
      toast({
        title: "Success",
        description: `${agentIds.length} agent(s) deleted.`,
        duration: TOAST_DEFAULT_DURATION,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete some agents.",
        variant: "destructive",
      });
    }

    setRowSelection({});
    setIsDeleteSelectedDialogOpen(false);
  };

  // Handle Firebase errors
  if (firestoreError) {
    return (
      <Main>
        <ErrorDisplay
          error={firestoreError}
          title="Agent rockets are offline!"
          message="Our agent loading system hit some space debris. Mission control is working on it!"
          onRetry={() => window.location.reload()}
          retryText="Retry Launch"
          component="MyAgents"
          action="loading_agents"
          metadata={{
            productId: selectedProduct?.id,
            phaseFilter,
            searchQuery,
          }}
        />
      </Main>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Main>
        <Breadcrumbs
          items={[{ label: "My Agents" }]}
          className="mb-4"
          data-testid="breadcrumbs"
        />

        <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">My Agents</h2>
            <p className="text-muted-foreground">
              Create and manage your AI agents for use outside of LaunchpadAI.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleCreateAgent}
              className="flex items-center gap-1"
              data-testid="create-agent-button"
              disabled={!selectedProduct?.id}
            >
              <Plus className="h-4 w-4" />
              <span>Create Agent</span>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <FilterBar
            mode="agents"
            placeholderText="Filter agents..."
            data-testid="agent-filter-bar"
          />
        </div>

        {layoutView === "card" ? <AgentGridSkeleton /> : <AgentTableSkeleton />}
      </Main>
    );
  }

  return (
    <>
      <Main>
        <Breadcrumbs
          items={[{ label: "My Agents" }]}
          className="mb-4"
          data-testid="breadcrumbs"
        />

        <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">My Agents</h2>
            <p className="text-muted-foreground">
              Create and manage your AI agents for use outside of LaunchpadAI.
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
              onClick={handleCreateAgent}
              className="flex items-center gap-1"
              data-testid="create-agent-button"
              disabled={!selectedProduct?.id}
            >
              <Plus className="h-4 w-4" />
              <span>Create Agent</span>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          {/* FilterBar component */}
          <FilterBar
            mode="agents"
            placeholderText="Filter agents..."
            data-testid="agent-filter-bar"
          />
        </div>

        {/* Empty state - No product selected */}
        {!selectedProduct?.id && (
          <div className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No product selected</h2>
            <p className="text-muted-foreground mb-6">
              Please select a product from the sidebar to view and manage your
              agents
            </p>
          </div>
        )}

        {/* Empty state - No agents found */}
        {selectedProduct?.id && !isLoading && filteredAgents.length === 0 && (
          <div className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No agents found</h2>
            <p className="text-muted-foreground mb-6">
              {formattedAgents.length === 0
                ? "You haven't created any agents yet"
                : "No agents match your search criteria"}
            </p>
            <Button onClick={handleCreateAgent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </div>
        )}

        {/* Agent cards grid */}
        {selectedProduct?.id &&
          !isLoading &&
          !firestoreError &&
          filteredAgents.length > 0 &&
          layoutView === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="border border-primary/20 rounded-md overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer hover:bg-accent h-64"
                  onClick={(e) => {
                    // Don't navigate if clicking on interactive elements
                    const target = e.target as HTMLElement;
                    if (
                      target.closest("button") ||
                      target.closest('[role="menuitem"]') ||
                      target.closest('[data-testid^="status-"]') ||
                      target.closest('[role="switch"]')
                    ) {
                      return;
                    }
                    handleViewAgent(agent);
                  }}
                >
                  {/* Header Section */}
                  <div className="p-4 relative">
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleViewAgent(agent);
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
                              handleEditAgent(agent);
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
                              setAgentToDelete(agent);
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
                      <Bot className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                      <h3 className="font-semibold text-md leading-tight">
                        {agent.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description || "No description"}
                    </p>
                  </div>

                  {/* System Prompt Section */}
                  <div className="flex-1 px-4 py-3 dark:bg-gray-900/50">
                    <div className="text-xs font-semibold text-black mb-1">
                      System Prompt
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                      {agent.systemPrompt || "No system prompt configured"}
                    </p>
                  </div>

                  {/* Footer Section */}
                  <div className="p-4 mt-auto">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.phases?.slice(0, 3).map((phase) => (
                        <span
                          key={phase}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                        >
                          {phase}
                        </span>
                      ))}
                      {agent.phases && agent.phases.length > 3 && (
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                          +{agent.phases.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <StatusToggle
                        agentId={agent.id}
                        isEnabled={agent.configuration?.isEnabled || false}
                        variant="switch"
                        size="sm"
                      />
                      <div className="text-xs text-muted-foreground">
                        {agent.collections.length} Collections
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Tanstack Table view */}
        {selectedProduct?.id &&
          !isLoading &&
          !firestoreError &&
          filteredAgents.length > 0 &&
          layoutView === "table" && (
            <AgentDataTable
              data={filteredAgents}
              onViewAgent={handleViewAgent}
              onEditAgent={handleEditAgent}
              onDeleteAgent={setAgentToDelete}
            />
          )}
      </Main>
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!agentToDelete}
        onOpenChange={(open) => !open && setAgentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgentToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
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
              selected {selectedRowCount} agent(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelectedAgents}
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
