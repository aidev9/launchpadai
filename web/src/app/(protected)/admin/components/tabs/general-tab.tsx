"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "../stats-card";
import { AdminChart, ChartDataType } from "../admin-chart";
import { Button } from "@/components/ui/button";
import { useAtom, useAtomValue } from "jotai";
import { adminRefreshTriggerAtom } from "../../admin-store";
import { isAdminAtom } from "@/lib/store/user-store";
import {
  RefreshCw,
  Users,
  Package,
  Lightbulb,
  Layers,
  FolderOpen,
  Bot,
} from "lucide-react";
import { ProductsWidget } from "../products-widget";
import {
  useCollection,
  useCollectionData,
} from "react-firebase-hooks/firestore";
import { firebaseAdminUsers } from "@/lib/firebase/client/FirebaseAdminUsers";
import { firebaseAdminProducts } from "@/lib/firebase/client/FirebaseAdminProducts";
import { firebaseAdminPrompts } from "@/lib/firebase/client/FirebaseAdminPrompts";
import { firebaseAdminStacks } from "@/lib/firebase/client/FirebaseAdminStacks";
import { firebaseAdminCollections } from "@/lib/firebase/client/FirebaseAdminCollections";
import { firebaseAdminAgents } from "@/lib/firebase/client/FirebaseAdminAgents";
import { ErrorDisplay } from "@/components/ui/error-display";
import { DocumentData } from "firebase/firestore";

export function GeneralTab() {
  const [refreshTrigger, setRefreshTrigger] = useAtom(adminRefreshTriggerAtom);
  const isAdmin = useAtomValue(isAdminAtom);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get timestamp for 30 days ago and 7 days ago
  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return Math.floor(date.getTime() / 1000); // Convert to seconds for Firestore
  }, []);

  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return Math.floor(date.getTime() / 1000); // Convert to seconds for Firestore
  }, []);

  const now = useMemo(() => Math.floor(Date.now() / 1000), []);

  // Users data with Firebase Hooks
  const [usersSnapshot, usersLoading, usersError] = useCollection(
    isAdmin ? firebaseAdminUsers.getUsersCountQuery() : null
  );

  // For new users, we would ideally filter by createdAt, but we'll use the full collection for now
  const [recentUsersSnapshot] = useCollection(
    isAdmin ? firebaseAdminUsers.getUsersCollection() : null
  );

  // Products data with Firebase Hooks
  const [productsSnapshot, productsLoading, productsError] = useCollection(
    isAdmin ? firebaseAdminProducts.getProductsCountQuery() : null
  );

  const [recentProductsSnapshot] = useCollection(
    isAdmin
      ? firebaseAdminProducts.getProductsInTimeRangeQuery(sevenDaysAgo, now)
      : null
  );

  // Prompts data with Firebase Hooks
  const [promptsSnapshot, promptsLoading, promptsError] = useCollection(
    isAdmin ? firebaseAdminPrompts.getPromptsCountQuery() : null
  );

  // We'll use a filter query since we don't have a time range query for prompts
  const [recentPromptsSnapshot] = useCollection(
    isAdmin ? firebaseAdminPrompts.getPromptsQuery(100) : null
  );

  // Stacks data with Firebase Hooks
  const [stacksSnapshot, stacksLoading, stacksError] = useCollection(
    isAdmin ? firebaseAdminStacks.getStacksCountQuery() : null
  );

  const [recentStacksSnapshot] = useCollection(
    isAdmin
      ? firebaseAdminStacks.getStacksInTimeRangeQuery(sevenDaysAgo, now)
      : null
  );

  // Collections data with Firebase Hooks
  const [collectionsSnapshot, collectionsLoading, collectionsError] =
    useCollection(
      isAdmin ? firebaseAdminCollections.getCollectionsCountQuery() : null
    );

  const [recentCollectionsSnapshot] = useCollection(
    isAdmin
      ? firebaseAdminCollections.getCollectionsInTimeRangeQuery(
          sevenDaysAgo,
          now
        )
      : null
  );

  // Agents data with Firebase Hooks
  const [agentsSnapshot, agentsLoading, agentsError] = useCollection(
    isAdmin ? firebaseAdminAgents.getAgentsCountQuery() : null
  );

  const [recentAgentsSnapshot] = useCollection(
    isAdmin
      ? firebaseAdminAgents.getAgentsInTimeRangeQuery(sevenDaysAgo, now)
      : null
  );

  // Extract counts from snapshots
  const totalUsers = usersSnapshot?.docs.length || 0;
  const newUsers =
    recentUsersSnapshot?.docs.filter((doc) => {
      const data = doc.data();
      return data.createdAt && data.createdAt >= sevenDaysAgo;
    }).length || 0;

  const totalProducts = productsSnapshot?.docs.length || 0;
  const newProducts = recentProductsSnapshot?.docs.length || 0;

  const totalPrompts = promptsSnapshot?.docs.length || 0;
  const newPrompts =
    recentPromptsSnapshot?.docs.filter((doc) => {
      const data = doc.data();
      return data.createdAt && data.createdAt >= sevenDaysAgo;
    }).length || 0;

  // Extract counts for stacks, collections, and agents
  const totalStacks = stacksSnapshot?.docs.length || 0;
  const newStacks = recentStacksSnapshot?.docs.length || 0;

  const totalCollections = collectionsSnapshot?.docs.length || 0;
  const newCollections = recentCollectionsSnapshot?.docs.length || 0;

  const totalAgents = agentsSnapshot?.docs.length || 0;
  const newAgents = recentAgentsSnapshot?.docs.length || 0;

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Create activity data from Firebase results (realistic implementation)
  const combinedActivityData = useMemo(() => {
    // Create a map to aggregate data by date
    const activityMap = new Map();

    // Process the last 30 days - create empty entries for all days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Create a default entry for this date
      activityMap.set(dateStr, {
        date: dateStr,
        signups: 0,
        products: 0,
        prompts: 0,
        stacks: 0,
        collections: 0,
        agents: 0,
      });
    }

    // Process users data - count signups by date
    recentUsersSnapshot?.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt >= thirtyDaysAgo) {
        const date = new Date(data.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (activityMap.has(dateStr)) {
          const entry = activityMap.get(dateStr);
          entry.signups += 1;
          activityMap.set(dateStr, entry);
        }
      }
    });

    // Process products data - group by creation date
    productsSnapshot?.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt >= thirtyDaysAgo) {
        const date = new Date(data.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (activityMap.has(dateStr)) {
          const entry = activityMap.get(dateStr);
          entry.products += 1;
          activityMap.set(dateStr, entry);
        }
      }
    });

    // Process prompts data - group by creation date
    promptsSnapshot?.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt >= thirtyDaysAgo) {
        const date = new Date(data.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (activityMap.has(dateStr)) {
          const entry = activityMap.get(dateStr);
          entry.prompts += 1;
          activityMap.set(dateStr, entry);
        }
      }
    });

    // Process stacks data - group by creation date
    stacksSnapshot?.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt >= thirtyDaysAgo) {
        const date = new Date(data.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (activityMap.has(dateStr)) {
          const entry = activityMap.get(dateStr);
          entry.stacks += 1;
          activityMap.set(dateStr, entry);
        }
      }
    });

    // Process collections data - group by creation date
    collectionsSnapshot?.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt >= thirtyDaysAgo) {
        const date = new Date(data.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (activityMap.has(dateStr)) {
          const entry = activityMap.get(dateStr);
          entry.collections += 1;
          activityMap.set(dateStr, entry);
        }
      }
    });

    // Process agents data - group by creation date
    agentsSnapshot?.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt >= thirtyDaysAgo) {
        const date = new Date(data.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (activityMap.has(dateStr)) {
          const entry = activityMap.get(dateStr);
          entry.agents += 1;
          activityMap.set(dateStr, entry);
        }
      }
    });

    // Convert the activity Map to an array
    const activityArray = Array.from(activityMap.values());

    // Sort by date ascending
    return activityArray.sort((a, b) => {
      const datePartsA = a.date.split(" ");
      const datePartsB = b.date.split(" ");

      const monthA = new Date(`${datePartsA[0]} 1, 2000`).getMonth();
      const monthB = new Date(`${datePartsB[0]} 1, 2000`).getMonth();

      if (monthA !== monthB) return monthA - monthB;

      // Same month, compare by day
      return parseInt(datePartsA[1]) - parseInt(datePartsB[1]);
    });
  }, [
    recentUsersSnapshot,
    productsSnapshot,
    promptsSnapshot,
    stacksSnapshot,
    collectionsSnapshot,
    agentsSnapshot,
    thirtyDaysAgo,
  ]);

  // Prepare chart data for activity
  const activityChartData = useMemo(() => {
    if (!combinedActivityData || combinedActivityData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: combinedActivityData.map((item) => item.date),
      datasets: [
        {
          label: "Signups",
          data: combinedActivityData.map((item) => item.signups),
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          tension: 0.2,
        },
        {
          label: "Products",
          data: combinedActivityData.map((item) => item.products),
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          tension: 0.2,
        },
        {
          label: "Prompts",
          data: combinedActivityData.map((item) => item.prompts),
          borderColor: "rgba(245, 158, 11, 1)",
          backgroundColor: "rgba(245, 158, 11, 0.5)",
          tension: 0.2,
        },
        {
          label: "Stacks",
          data: combinedActivityData.map((item) => item.stacks),
          borderColor: "rgba(139, 92, 246, 1)",
          backgroundColor: "rgba(139, 92, 246, 0.5)",
          tension: 0.2,
        },
        {
          label: "Collections",
          data: combinedActivityData.map((item) => item.collections),
          borderColor: "rgba(236, 72, 153, 1)",
          backgroundColor: "rgba(236, 72, 153, 0.5)",
          tension: 0.2,
        },
        {
          label: "Agents",
          data: combinedActivityData.map((item) => item.agents),
          borderColor: "rgba(6, 182, 212, 1)",
          backgroundColor: "rgba(6, 182, 212, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [combinedActivityData]);

  // Prepare chart data for entity distribution
  const entityDistributionData: ChartDataType = useMemo(() => {
    if (!usersSnapshot || !productsSnapshot || !promptsSnapshot) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: [
        "Users",
        "Products",
        "Prompts",
        "Stacks",
        "Collections",
        "Agents",
      ],
      datasets: [
        {
          label: "Entity Distribution",
          data: [
            totalUsers,
            totalProducts,
            totalPrompts,
            totalStacks,
            totalCollections,
            totalAgents,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(139, 92, 246, 0.7)",
            "rgba(236, 72, 153, 0.7)",
            "rgba(6, 182, 212, 0.7)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(236, 72, 153, 1)",
            "rgba(6, 182, 212, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [
    totalUsers,
    totalProducts,
    totalPrompts,
    totalStacks,
    totalCollections,
    totalAgents,
  ]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    setRefreshKey((prev) => prev + 1);
    console.log("Admin dashboard refreshed");
  };

  // Handle Firebase errors
  const hasErrors =
    usersError ||
    productsError ||
    promptsError ||
    stacksError ||
    collectionsError ||
    agentsError;
  if (hasErrors) {
    const firstError =
      usersError ||
      productsError ||
      promptsError ||
      stacksError ||
      collectionsError ||
      agentsError;
    return (
      <ErrorDisplay
        error={firstError}
        title="Admin dashboard rockets are offline!"
        message="Our admin data loading system hit some space debris. Mission control is working on it!"
        onRetry={() => window.location.reload()}
        retryText="Retry Launch"
        component="AdminGeneralTab"
        action="loading_admin_data"
        metadata={{
          hasUsersError: !!usersError,
          hasProductsError: !!productsError,
          hasPromptsError: !!promptsError,
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-9 gap-1"
          data-testid="admin-refresh"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Users"
          value={usersLoading ? "..." : formatNumber(totalUsers)}
          icon={<Users className="h-4 w-4" />}
          trend={{
            value: usersLoading ? "..." : `${formatNumber(newUsers)} new`,
            positive: true,
          }}
          isLoading={usersLoading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
          data-testid="users-stats"
        />

        <StatsCard
          title="Products"
          value={productsLoading ? "..." : formatNumber(totalProducts)}
          icon={<Package className="h-4 w-4" />}
          trend={{
            value: productsLoading ? "..." : `${formatNumber(newProducts)} new`,
            positive: true,
          }}
          isLoading={productsLoading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
          data-testid="products-stats"
        />

        <StatsCard
          title="Prompts"
          value={promptsLoading ? "..." : formatNumber(totalPrompts)}
          icon={<Lightbulb className="h-4 w-4" />}
          trend={{
            value: promptsLoading ? "..." : `${formatNumber(newPrompts)} new`,
            positive: true,
          }}
          isLoading={promptsLoading}
          iconBackground="bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300"
          data-testid="prompts-stats"
        />

        <StatsCard
          title="Stacks"
          value={formatNumber(totalStacks)}
          icon={<Layers className="h-4 w-4" />}
          trend={{
            value: `${formatNumber(newStacks)} new`,
            positive: true,
          }}
          isLoading={false}
          iconBackground="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
          data-testid="stacks-stats"
        />

        <StatsCard
          title="Collections"
          value={formatNumber(totalCollections)}
          icon={<FolderOpen className="h-4 w-4" />}
          trend={{
            value: `${formatNumber(newCollections)} new`,
            positive: true,
          }}
          isLoading={false}
          iconBackground="bg-pink-100 text-pink-600 dark:bg-pink-800 dark:text-pink-300"
          data-testid="collections-stats"
        />

        <StatsCard
          title="Agents"
          value={formatNumber(totalAgents)}
          icon={<Bot className="h-4 w-4" />}
          trend={{
            value: `${formatNumber(newAgents)} new`,
            positive: true,
          }}
          isLoading={false}
          iconBackground="bg-cyan-100 text-cyan-600 dark:bg-cyan-800 dark:text-cyan-300"
          data-testid="agents-stats"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="Activity Over Time"
          description="User and content creation activity over the last 30 days"
          chartData={activityChartData}
          type="line"
          height={300}
          isLoading={
            usersLoading ||
            productsLoading ||
            promptsLoading ||
            stacksLoading ||
            collectionsLoading ||
            agentsLoading
          }
          data-testid="activity-chart"
        />

        <AdminChart
          title="Entity Distribution"
          description="Distribution of different entity types in the system"
          chartData={entityDistributionData}
          type="doughnut"
          height={300}
          isLoading={
            usersLoading ||
            productsLoading ||
            promptsLoading ||
            stacksLoading ||
            collectionsLoading ||
            agentsLoading
          }
          data-testid="distribution-chart"
        />
      </div>

      {/* Products Widget with Real-time Firebase Data */}
      {/* <ProductsWidget data-testid="products-widget" /> */}
    </div>
  );
}
