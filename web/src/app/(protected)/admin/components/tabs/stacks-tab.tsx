"use client";

import { useMemo } from "react";
import { AdminChart } from "../admin-chart";
import { StatsCard } from "../stats-card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Layers } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminStacks } from "@/lib/firebase/client/FirebaseAdminStacks";
import { useAtomValue } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { StacksTable } from "../../stacks/components/stacks-table";

export function StacksTab() {
  const isAdmin = useAtomValue(isAdminAtom);

  // Use React Firebase Hooks for real-time data like the other tabs
  const [stacksData, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminStacks.getStacksCountQuery() : null
  );

  // Transform and sort the data by createdAt DESC
  const stacks = useMemo(() => {
    if (!stacksData) return [];

    console.log("Raw stacksData in stacks-tab:", stacksData);

    return stacksData
      .map((stack: any) => {
        console.log("Processing stack in stacks-tab:", stack);
        return {
          id: stack.id,
          userId: stack.userId || "unknown",
          title: stack.name || "Untitled Stack",
          description: stack.description || "",
          isPublic: stack.isPublic || false,
          components: stack.components || [],
          views: Number(stack.views || 0),
          likes: Number(stack.likes || 0),
          createdAt: stack.createdAt || Date.now() / 1000,
          updatedAt: stack.updatedAt || Date.now() / 1000,
          tags: stack.tags || [],
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC
  }, [stacksData]);

  // Debug logging
  console.log("Stacks tab debug:", {
    isAdmin,
    stacksData,
    loading,
    error,
    stacksCount: stacks.length,
  });

  // Calculate stats
  const publicStacksCount = stacks.filter((stack) => stack.isPublic).length;
  const mostComponents = stacks.length
    ? Math.max(...stacks.map((stack) => (stack.components || []).length))
    : 0;
  const mostViewed = stacks.length
    ? Math.max(...stacks.map((stack) => stack.views || 0))
    : 0;

  // Prepare chart data for stack creation over time
  const stackCreationData = useMemo(() => {
    if (!stacks.length) {
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Stacks Created",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "rgba(139, 92, 246, 1)",
            backgroundColor: "rgba(139, 92, 246, 0.5)",
            tension: 0.2,
          },
        ],
      };
    }

    // Group stacks by month
    const monthCounts: Record<string, number> = {};
    const currentDate = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthKey = date.toLocaleDateString("en-US", { month: "short" });
      monthCounts[monthKey] = 0;
    }

    // Count stacks by month
    stacks.forEach((stack) => {
      if (stack.createdAt) {
        const date = new Date(stack.createdAt * 1000);
        const monthKey = date.toLocaleDateString("en-US", { month: "short" });
        if (monthCounts.hasOwnProperty(monthKey)) {
          monthCounts[monthKey]++;
        }
      }
    });

    return {
      labels: Object.keys(monthCounts),
      datasets: [
        {
          label: "Stacks Created",
          data: Object.values(monthCounts),
          borderColor: "rgba(139, 92, 246, 1)",
          backgroundColor: "rgba(139, 92, 246, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [stacks]);

  // Prepare chart data for component distribution
  const componentDistributionData = useMemo(() => {
    if (!stacks.length) {
      return {
        labels: [
          "APIs",
          "Databases",
          "UI Components",
          "Authentication",
          "Other",
        ],
        datasets: [
          {
            label: "Component Distribution",
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(139, 92, 246, 0.7)",
              "rgba(236, 72, 153, 0.7)",
            ],
            borderColor: [
              "rgba(59, 130, 246, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(139, 92, 246, 1)",
              "rgba(236, 72, 153, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    // Categorize components by type (simplified categorization)
    const componentCounts = {
      apis: 0,
      databases: 0,
      uiComponents: 0,
      authentication: 0,
      other: 0,
    };

    stacks.forEach((stack) => {
      const components = stack.components || [];
      components.forEach((component: any) => {
        const componentStr =
          typeof component === "string" ? component.toLowerCase() : "";

        if (
          componentStr.includes("api") ||
          componentStr.includes("rest") ||
          componentStr.includes("graphql")
        ) {
          componentCounts.apis++;
        } else if (
          componentStr.includes("database") ||
          componentStr.includes("db") ||
          componentStr.includes("mongo") ||
          componentStr.includes("postgres")
        ) {
          componentCounts.databases++;
        } else if (
          componentStr.includes("ui") ||
          componentStr.includes("component") ||
          componentStr.includes("react") ||
          componentStr.includes("vue")
        ) {
          componentCounts.uiComponents++;
        } else if (
          componentStr.includes("auth") ||
          componentStr.includes("login") ||
          componentStr.includes("jwt")
        ) {
          componentCounts.authentication++;
        } else {
          componentCounts.other++;
        }
      });
    });

    return {
      labels: ["APIs", "Databases", "UI Components", "Authentication", "Other"],
      datasets: [
        {
          label: "Component Distribution",
          data: [
            componentCounts.apis,
            componentCounts.databases,
            componentCounts.uiComponents,
            componentCounts.authentication,
            componentCounts.other,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(139, 92, 246, 0.7)",
            "rgba(236, 72, 153, 0.7)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(236, 72, 153, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [stacks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Stacks</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Stacks"
          value={stacks.length}
          icon={<Layers className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
        />
        <StatsCard
          title="Public Stacks"
          value={publicStacksCount}
          isLoading={loading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
        />
        <StatsCard
          title="Most Components"
          value={mostComponents}
          description="Highest component count"
          isLoading={loading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
        />
        <StatsCard
          title="Most Viewed"
          value={mostViewed}
          description="Highest view count"
          isLoading={loading}
          iconBackground="bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="Stack Creation Trend"
          description="New stacks created over time"
          chartData={stackCreationData}
          type="line"
          height={250}
        />
        <AdminChart
          title="Component Distribution"
          description="Distribution of stack components by type"
          chartData={componentDistributionData}
          type="doughnut"
          height={250}
        />
      </div>

      {/* Show error if any */}
      {error && (
        <div className="text-red-500 p-4 border border-red-200 rounded">
          Error: {error.message}
        </div>
      )}

      {/* Stack Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">Stack Table</h3>
        <StacksTable />
      </div>
    </div>
  );
}
