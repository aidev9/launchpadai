"use client";

import { useMemo } from "react";
import { AdminChart } from "../admin-chart";
import { StatsCard } from "../stats-card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Lightbulb } from "lucide-react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminPrompts } from "@/lib/firebase/client/FirebaseAdminPrompts";
import { useAtomValue } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { PromptsTable } from "../../prompts/components/prompts-table";

export function PromptsTab() {
  const isAdmin = useAtomValue(isAdminAtom);

  // Use React Firebase Hooks for real-time data like the other tabs
  const [promptsData, loading, error] = useCollectionData(
    isAdmin ? firebaseAdminPrompts.getPromptsCountQuery() : null // Use count query like products tab to avoid index requirement
  );

  // Transform and sort the data by createdAt DESC
  const prompts = useMemo(() => {
    if (!promptsData) return [];

    return promptsData
      .map((prompt: any) => ({
        id: prompt.id,
        userId: prompt.userId || "unknown",
        title: prompt.title || "Untitled Prompt",
        content: prompt.body || prompt.content || "",
        isPublic: prompt.isPublic || false,
        views: Number(prompt.views || 0),
        likes: Number(prompt.likes || 0),
        createdAt: prompt.createdAt || Date.now() / 1000,
        updatedAt: prompt.updatedAt || Date.now() / 1000,
        phaseTags: prompt.phaseTags || [],
        productTags: prompt.productTags || [],
        tags: prompt.tags || [],
        sourcePromptId: prompt.sourcePromptId,
      }))
      .sort((a, b) => b.createdAt - a.createdAt); // Sort by createdAt DESC
  }, [promptsData]);

  // Debug logging
  console.log("Prompts tab debug:", {
    isAdmin,
    promptsData,
    loading,
    error,
    promptsCount: prompts.length,
  });

  // Calculate stats
  const publicPromptsCount = prompts.filter((prompt) => prompt.isPublic).length;
  const mostViewed = prompts.length
    ? Math.max(...prompts.map((prompt) => prompt.views || 0))
    : 0;
  const mostLiked = prompts.length
    ? Math.max(...prompts.map((prompt) => prompt.likes || 0))
    : 0;

  // Prepare chart data for prompt creation over time
  const promptCreationData = useMemo(() => {
    if (!prompts.length) {
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Prompts Created",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "rgba(245, 158, 11, 1)",
            backgroundColor: "rgba(245, 158, 11, 0.5)",
            tension: 0.2,
          },
        ],
      };
    }

    // Group prompts by month
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

    // Count prompts by month
    prompts.forEach((prompt) => {
      if (prompt.createdAt) {
        const date = new Date(prompt.createdAt * 1000);
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
          label: "Prompts Created",
          data: Object.values(monthCounts),
          borderColor: "rgba(245, 158, 11, 1)",
          backgroundColor: "rgba(245, 158, 11, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [prompts]);

  // Prepare chart data for prompt length distribution
  const promptLengthData = useMemo(() => {
    if (!prompts.length) {
      return {
        labels: [
          "Short (0-100)",
          "Medium (101-500)",
          "Long (501-1000)",
          "Very Long (1000+)",
        ],
        datasets: [
          {
            label: "Prompt Length Distribution",
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(59, 130, 246, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderColor: [
              "rgba(59, 130, 246, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(239, 68, 68, 1)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    // Categorize prompts by content length
    const lengthCounts = { short: 0, medium: 0, long: 0, veryLong: 0 };

    prompts.forEach((prompt) => {
      const contentLength = (prompt.content || "").length;
      if (contentLength <= 100) {
        lengthCounts.short++;
      } else if (contentLength <= 500) {
        lengthCounts.medium++;
      } else if (contentLength <= 1000) {
        lengthCounts.long++;
      } else {
        lengthCounts.veryLong++;
      }
    });

    return {
      labels: [
        "Short (0-100)",
        "Medium (101-500)",
        "Long (501-1000)",
        "Very Long (1000+)",
      ],
      datasets: [
        {
          label: "Prompt Length Distribution",
          data: [
            lengthCounts.short,
            lengthCounts.medium,
            lengthCounts.long,
            lengthCounts.veryLong,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [prompts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Prompts</h2>
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
          title="Total Prompts"
          value={prompts.length}
          icon={<Lightbulb className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300"
        />
        <StatsCard
          title="Public Prompts"
          value={publicPromptsCount}
          isLoading={loading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
        />
        <StatsCard
          title="Most Viewed"
          value={mostViewed}
          description="Highest view count"
          isLoading={loading}
          iconBackground="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
        />
        <StatsCard
          title="Most Liked"
          value={mostLiked}
          description="Highest like count"
          isLoading={loading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="Prompt Creation"
          description="Prompts created over time"
          chartData={promptCreationData}
          type="line"
          height={250}
        />
        <AdminChart
          title="Prompt Length Distribution"
          description="Distribution of prompts by content length"
          chartData={promptLengthData}
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

      {/* Prompts Table */}
      <PromptsTable />
    </div>
  );
}
