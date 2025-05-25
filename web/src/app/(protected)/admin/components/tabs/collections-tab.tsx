"use client";

import { useMemo } from "react";
import { AdminChart } from "../admin-chart";
import { StatsCard } from "../stats-card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FolderOpen } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminCollections } from "@/lib/firebase/client/FirebaseAdminCollections";
import { useAtomValue } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { CollectionsTable } from "../../collections/components/collections-table";

export function CollectionsTab() {
  const isAdmin = useAtomValue(isAdminAtom);

  // Use React Firebase Hooks for real-time data like the other tabs
  const [collectionsData, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminCollections.getCollectionsCountQuery() : null
  );

  // Transform and sort the data by createdAt DESC
  const collections = useMemo(() => {
    if (!collectionsData) return [];

    return collectionsData
      .map((collection: any) => ({
        id: collection.id,
        userId: collection.userId || "unknown",
        title: collection.title || "Untitled Collection",
        description: collection.description || "",
        isPublic: collection.isPublic || false,
        items: collection.items || [],
        itemCount: collection.itemCount || (collection.items || []).length,
        views: Number(collection.views || 0),
        likes: Number(collection.likes || 0),
        createdAt: collection.createdAt || Date.now() / 1000,
        updatedAt: collection.updatedAt || Date.now() / 1000,
        tags: collection.tags || [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC
  }, [collectionsData]);

  // Debug logging
  console.log("Collections tab debug:", {
    isAdmin,
    collectionsData,
    loading,
    error,
    collectionsCount: collections.length,
  });

  // Calculate stats
  const publicCollectionsCount = collections.filter(
    (collection) => collection.isPublic
  ).length;
  const largestCollection = collections.length
    ? Math.max(...collections.map((collection) => collection.itemCount || 0))
    : 0;
  const mostViewed = collections.length
    ? Math.max(...collections.map((collection) => collection.views || 0))
    : 0;

  // Prepare chart data for collection creation over time
  const collectionCreationData = useMemo(() => {
    if (!collections.length) {
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Collections Created",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "rgba(236, 72, 153, 1)",
            backgroundColor: "rgba(236, 72, 153, 0.5)",
            tension: 0.2,
          },
        ],
      };
    }

    // Group collections by month
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

    // Count collections by month
    collections.forEach((collection) => {
      if (collection.createdAt) {
        const date = new Date(collection.createdAt * 1000);
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
          label: "Collections Created",
          data: Object.values(monthCounts),
          borderColor: "rgba(236, 72, 153, 1)",
          backgroundColor: "rgba(236, 72, 153, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [collections]);

  // Prepare chart data for collection size distribution
  const collectionSizeData = useMemo(() => {
    if (!collections.length) {
      return {
        labels: [
          "Small (1-5)",
          "Medium (6-20)",
          "Large (21-50)",
          "Very Large (50+)",
        ],
        datasets: [
          {
            label: "Collection Size Distribution",
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(139, 92, 246, 0.7)",
            ],
            borderColor: [
              "rgba(59, 130, 246, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(139, 92, 246, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    // Categorize collections by size
    const sizeCounts = { small: 0, medium: 0, large: 0, veryLarge: 0 };

    collections.forEach((collection) => {
      const itemCount = collection.itemCount || 0;
      if (itemCount <= 5) {
        sizeCounts.small++;
      } else if (itemCount <= 20) {
        sizeCounts.medium++;
      } else if (itemCount <= 50) {
        sizeCounts.large++;
      } else {
        sizeCounts.veryLarge++;
      }
    });

    return {
      labels: [
        "Small (1-5)",
        "Medium (6-20)",
        "Large (21-50)",
        "Very Large (50+)",
      ],
      datasets: [
        {
          label: "Collection Size Distribution",
          data: [
            sizeCounts.small,
            sizeCounts.medium,
            sizeCounts.large,
            sizeCounts.veryLarge,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(139, 92, 246, 0.7)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(139, 92, 246, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [collections]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
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
          title="Total Collections"
          value={collections.length}
          icon={<FolderOpen className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-pink-100 text-pink-600 dark:bg-pink-800 dark:text-pink-300"
        />
        <StatsCard
          title="Public Collections"
          value={publicCollectionsCount}
          isLoading={loading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
        />
        <StatsCard
          title="Largest Collection"
          value={largestCollection}
          description="Most items in collection"
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
          title="Collection Growth"
          description="New collections created over time"
          chartData={collectionCreationData}
          type="line"
          height={250}
        />
        <AdminChart
          title="Collection Size Distribution"
          description="Distribution of collections by number of items"
          chartData={collectionSizeData}
          type="pie"
          height={250}
        />
      </div>

      {/* Show error if any */}
      {error && (
        <div className="text-red-500 p-4 border border-red-200 rounded">
          Error: {error.message}
        </div>
      )}

      {/* Collections Table */}
      <CollectionsTable />
    </div>
  );
}
