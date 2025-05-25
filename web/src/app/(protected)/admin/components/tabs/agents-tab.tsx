"use client";

import { useState, useMemo } from "react";
import { DataTable } from "../data-table";
import { FilterBar } from "../filter-bar";
import { ActionButtons, BulkActionButtons } from "../action-buttons";
import { AdminChart } from "../admin-chart";
import { StatsCard } from "../stats-card";
import { Button } from "@/components/ui/button";
import { useAtom, useAtomValue } from "jotai";
import {
  adminPaginationAtom,
  adminSelectedItemsAtom,
  adminFilterStateAtom,
} from "../../admin-store";
import { Agent } from "../../types/admin-types";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bot, Eye, ThumbsUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminAgents } from "@/lib/firebase/client/FirebaseAdminAgents";
import { isAdminAtom } from "@/lib/store/user-store";

export function AgentsTab() {
  const [pagination, setPagination] = useAtom(adminPaginationAtom);
  const [selectedItems, setSelectedItems] = useAtom(adminSelectedItemsAtom);
  const [filterState, setFilterState] = useAtom(adminFilterStateAtom);
  const [searchQuery, setSearchQuery] = useState("");
  const [editAgentDialogOpen, setEditAgentDialogOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const isAdmin = useAtomValue(isAdminAtom);

  // Use React Firebase Hooks for real-time data like the other tabs
  const [agentsData, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminAgents.getAgentsCountQuery() : null
  );

  // Transform and sort the data by createdAt DESC
  const agents = useMemo(() => {
    if (!agentsData) return [];

    return agentsData
      .map((agent: any) => ({
        id: agent.id,
        userId: agent.userId || "unknown",
        title: agent.name || agent.title || "Untitled Agent",
        description: agent.description || "",
        isPublic: agent.isPublic || false,
        capabilities: agent.tools || [],
        usageCount: Number(agent.usageCount || 0),
        views: Number(agent.views || 0),
        likes: Number(agent.likes || 0),
        createdAt: agent.createdAt || Date.now() / 1000,
        updatedAt: agent.updatedAt || Date.now() / 1000,
        tags: agent.tags || [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC
  }, [agentsData]);

  // Debug logging
  console.log("Agents tab debug:", {
    isAdmin,
    agentsData,
    loading,
    error,
    agentsCount: agents.length,
  });

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      ...pagination,
      page,
      pageSize,
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination({
      ...pagination,
      page: 1,
    });
  };

  // Handle filter change
  const handleFilterChange = (filters: Record<string, any>) => {
    setFilterState(filters);
    setPagination({
      ...pagination,
      page: 1,
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    console.log("Bulk delete agents:", selectedItems);
    // TODO: Implement bulk delete functionality
    setSelectedItems([]);
  };

  // Handle edit agent
  const handleEditAgent = (agent: Agent) => {
    setCurrentAgent(agent);
    setEditAgentDialogOpen(true);
  };

  // Handle save agent
  const handleSaveAgent = async () => {
    if (!currentAgent) return;

    console.log("Save agent:", currentAgent);
    // TODO: Implement save functionality

    setEditAgentDialogOpen(false);
    setCurrentAgent(null);
  };

  // Handle delete agent
  const handleDeleteAgent = (agentId: string) => {
    console.log("Delete agent:", agentId);
    // TODO: Implement delete functionality
  };

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Define columns for the data table
  const columns = useMemo<ColumnDef<Agent>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Agent",
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <div className="flex items-center gap-2">
              <div>
                <div className="font-medium">
                  {agent.title || "Unnamed Agent"}
                </div>
                {agent.description && (
                  <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {agent.description}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "user",
        header: "Creator",
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return "Unknown";
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={user.photoURL || ""}
                  alt={user.displayName || user.email}
                />
                <AvatarFallback>
                  {getUserInitials(user.displayName || user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[150px]">
                {user.displayName || user.email}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "capabilities",
        header: "Capabilities",
        cell: ({ row }) => {
          const capabilities = row.original.capabilities || [];
          return (
            <div className="flex items-center gap-1">
              <span>{capabilities.length}</span>
              {capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {capabilities.slice(0, 2).map((capability, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {typeof capability === "string"
                        ? capability
                        : "Capability"}
                    </Badge>
                  ))}
                  {capabilities.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{capabilities.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "usageCount",
        header: "Usage",
        cell: ({ row }) => row.original.usageCount || 0,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "views",
        header: "Views",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{row.original.views || 0}</span>
          </div>
        ),
      },
      {
        accessorKey: "isPublic",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isPublic ? "default" : "outline"}>
            {row.original.isPublic ? "Public" : "Private"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <ActionButtons
            onEdit={() => handleEditAgent(row.original)}
            onDelete={() => handleDeleteAgent(row.original.id)}
            itemName={row.original.title}
            itemType="agent"
          />
        ),
      },
    ],
    []
  );

  // Define filter options
  const filterOptions = [
    {
      id: "isPublic",
      label: "Status",
      options: [
        { label: "Public", value: "true" },
        { label: "Private", value: "false" },
      ],
    },
  ];

  // Prepare chart data for agent usage
  const agentUsageData = useMemo(() => {
    // Group agents by creation month for the last 6 months
    const now = new Date();
    const months = [];
    const agentCounts = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      months.push(monthName);

      // Count agents created in this month
      const monthStart = date.getTime() / 1000;
      const monthEnd =
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime() / 1000;

      const agentsInMonth = agents.filter(
        (agent) => agent.createdAt >= monthStart && agent.createdAt <= monthEnd
      ).length;

      agentCounts.push(agentsInMonth);
    }

    return {
      labels: months,
      datasets: [
        {
          label: "Agents Created",
          data: agentCounts,
          borderColor: "rgba(6, 182, 212, 1)",
          backgroundColor: "rgba(6, 182, 212, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [agents]);

  // Prepare chart data for agent capabilities
  const agentCapabilitiesData = useMemo(() => {
    // Count different types of capabilities
    const capabilityCount = new Map<string, number>();

    agents.forEach((agent) => {
      if (agent.capabilities && Array.isArray(agent.capabilities)) {
        agent.capabilities.forEach((capability) => {
          let capabilityName = "Other";

          if (typeof capability === "string") {
            // Map capability names to categories
            const lowerCapability = capability.toLowerCase();
            if (
              lowerCapability.includes("text") ||
              lowerCapability.includes("chat") ||
              lowerCapability.includes("conversation")
            ) {
              capabilityName = "Text Generation";
            } else if (
              lowerCapability.includes("image") ||
              lowerCapability.includes("vision") ||
              lowerCapability.includes("photo")
            ) {
              capabilityName = "Image Generation";
            } else if (
              lowerCapability.includes("data") ||
              lowerCapability.includes("analysis") ||
              lowerCapability.includes("analytics")
            ) {
              capabilityName = "Data Analysis";
            } else if (
              lowerCapability.includes("code") ||
              lowerCapability.includes("programming") ||
              lowerCapability.includes("develop")
            ) {
              capabilityName = "Coding";
            } else if (
              lowerCapability.includes("search") ||
              lowerCapability.includes("web")
            ) {
              capabilityName = "Web Search";
            }
          } else if (typeof capability === "object" && capability !== null) {
            // Handle object-type capabilities
            const name =
              capability.name || capability.type || capability.tool || "";
            if (typeof name === "string") {
              const lowerName = name.toLowerCase();
              if (lowerName.includes("text") || lowerName.includes("chat")) {
                capabilityName = "Text Generation";
              } else if (
                lowerName.includes("image") ||
                lowerName.includes("vision")
              ) {
                capabilityName = "Image Generation";
              } else if (
                lowerName.includes("data") ||
                lowerName.includes("analysis")
              ) {
                capabilityName = "Data Analysis";
              } else if (
                lowerName.includes("code") ||
                lowerName.includes("programming")
              ) {
                capabilityName = "Coding";
              } else if (
                lowerName.includes("search") ||
                lowerName.includes("web")
              ) {
                capabilityName = "Web Search";
              }
            }
          }

          capabilityCount.set(
            capabilityName,
            (capabilityCount.get(capabilityName) || 0) + 1
          );
        });
      }
    });

    // If no capabilities found, show empty state
    if (capabilityCount.size === 0) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "Agent Capabilities",
            data: [1],
            backgroundColor: ["rgba(156, 163, 175, 0.7)"],
            borderColor: ["rgba(156, 163, 175, 1)"],
            borderWidth: 1,
          },
        ],
      };
    }

    // Convert to arrays for chart
    const labels = Array.from(capabilityCount.keys());
    const data = Array.from(capabilityCount.values());

    // Define colors for different capability types
    const colors = [
      "rgba(59, 130, 246, 0.7)", // Blue for Text Generation
      "rgba(16, 185, 129, 0.7)", // Green for Image Generation
      "rgba(245, 158, 11, 0.7)", // Orange for Data Analysis
      "rgba(139, 92, 246, 0.7)", // Purple for Coding
      "rgba(236, 72, 153, 0.7)", // Pink for Web Search
      "rgba(156, 163, 175, 0.7)", // Gray for Other
    ];

    const borderColors = [
      "rgba(59, 130, 246, 1)",
      "rgba(16, 185, 129, 1)",
      "rgba(245, 158, 11, 1)",
      "rgba(139, 92, 246, 1)",
      "rgba(236, 72, 153, 1)",
      "rgba(156, 163, 175, 1)",
    ];

    return {
      labels,
      datasets: [
        {
          label: "Agent Capabilities",
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: borderColors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  }, [agents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPagination({
                ...pagination,
                page: 1,
              });
            }}
            className="h-9 gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Agents"
          value={agents.length}
          icon={<Bot className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-cyan-100 text-cyan-600 dark:bg-cyan-800 dark:text-cyan-300"
        />
        <StatsCard
          title="Public Agents"
          value={agents.filter((agent) => agent.isPublic).length}
          isLoading={loading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
        />
        <StatsCard
          title="Most Used"
          value={
            agents.length
              ? Math.max(...agents.map((agent) => agent.usageCount))
              : 0
          }
          description="Highest usage count"
          isLoading={loading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
        />
        <StatsCard
          title="Most Capabilities"
          value={
            agents.length
              ? Math.max(...agents.map((agent) => agent.capabilities.length))
              : 0
          }
          description="Most capabilities in an agent"
          isLoading={loading}
          iconBackground="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="Agent Creation Trend"
          description="Number of agents created over the last 6 months"
          chartData={agentUsageData}
          type="line"
          height={250}
        />
        <AdminChart
          title="Agent Capabilities Distribution"
          description="Distribution of capabilities across all agents"
          chartData={agentCapabilitiesData}
          type="doughnut"
          height={250}
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filterOptions}
        onFilterChange={handleFilterChange}
        activeFilters={filterState}
      />

      {/* Bulk Actions */}
      <BulkActionButtons
        selectedCount={selectedItems.length}
        onDelete={handleBulkDelete}
        itemType="agents"
      />

      {/* Agents Table */}
      <DataTable
        columns={columns}
        data={agents}
        totalItems={agents.length}
        onPaginationChange={handlePaginationChange}
        onSearch={handleSearch}
        currentPage={pagination.page}
        pageSize={pagination.pageSize}
        isLoading={loading}
        searchPlaceholder="Search agents by title..."
        showSelection={true}
      />

      {/* Edit Agent Dialog */}
      <Dialog open={editAgentDialogOpen} onOpenChange={setEditAgentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Make changes to the agent. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {currentAgent && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={currentAgent.title || ""}
                  onChange={(e) =>
                    setCurrentAgent({
                      ...currentAgent,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={currentAgent.description || ""}
                  onChange={(e) =>
                    setCurrentAgent({
                      ...currentAgent,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={currentAgent.isPublic || false}
                  onCheckedChange={(checked) =>
                    setCurrentAgent({
                      ...currentAgent,
                      isPublic: checked,
                    })
                  }
                />
                <Label htmlFor="public">Public</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditAgentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAgent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
