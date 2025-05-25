"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./stats-card";
import { Package, RefreshCw, Eye, ThumbsUp } from "lucide-react";
import { firebaseAdminProducts } from "@/lib/firebase/client/FirebaseAdminProducts";
import {
  useCollection,
  useCollectionData,
} from "react-firebase-hooks/firestore";
import { useAtomValue } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { DocumentData } from "firebase/firestore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminChart } from "./admin-chart";

// Define types for product data
type ProductData = {
  id?: string;
  name?: string;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
  views?: number;
  likes?: number;
  isPublic?: boolean;
  userName?: string;
  userId?: string;
  phases?: string[];
  stage?: string;
  [key: string]: any;
};

export function ProductsWidget() {
  const isAdmin = useAtomValue(isAdminAtom);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get total product count using the collection group query
  const [countSnapshot, countLoading, countError] = useCollection(
    isAdmin ? firebaseAdminProducts.getProductsCountQuery() : null
  );

  // Get trending products (most recently updated)
  const [trendingProductsSnapshot, trendingLoading, trendingError] =
    useCollectionData<DocumentData>(
      isAdmin ? firebaseAdminProducts.getTrendingProductsQuery(3) : null
    );

  // Get activity data for the last 30 days
  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return Math.floor(date.getTime() / 1000); // Convert to seconds for Firestore
  }, []);

  const now = useMemo(() => Math.floor(Date.now() / 1000), []);

  const [activitySnapshot, activityLoading, activityError] = useCollectionData(
    isAdmin
      ? firebaseAdminProducts.getProductsInTimeRangeQuery(thirtyDaysAgo, now)
      : null
  );

  // Calculate new products in the last 7 days
  const sevenDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return Math.floor(date.getTime() / 1000); // Convert to seconds for Firestore
  }, []);

  const [newProductsSnapshot, newProductsLoading, newProductsError] =
    useCollectionData(
      isAdmin
        ? firebaseAdminProducts.getProductsInTimeRangeQuery(sevenDaysAgo, now)
        : null
    );

  // Extract product data from Firestore snapshots
  const productDocs = countSnapshot?.docs || [];
  const totalProducts = productDocs.length;

  // Handle data from useCollectionData which returns an array
  const trendingProducts: ProductData[] = trendingProductsSnapshot || [];
  const activityProducts: ProductData[] = activitySnapshot || [];
  const newProducts: ProductData[] = newProductsSnapshot || [];

  const newProductsCount = newProducts.length;

  // Format date for display
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Prepare chart data for product creation trend
  const productTrendData = useMemo(() => {
    if (!activityProducts || activityProducts.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Group by day
    const productsByDay = activityProducts.reduce(
      (acc: Record<string, number>, product: ProductData) => {
        if (product.createdAt) {
          const date = new Date(product.createdAt * 1000);
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          acc[dateStr] = (acc[dateStr] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    // Create a date range for the last 30 days
    const dateLabels: string[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dateLabels.push(dateStr);
    }

    // Map data to the date range
    const productCounts = dateLabels.map((date) => productsByDay[date] || 0);

    return {
      labels: dateLabels,
      datasets: [
        {
          label: "Products Created",
          data: productCounts,
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [activityProducts]);

  // Prepare chart data for product categories
  const productCategoriesData = useMemo(() => {
    if (!activityProducts || activityProducts.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Count products by phase (category)
    const phaseCount: Record<string, number> = {};
    let totalWithPhases = 0;

    activityProducts.forEach((product: ProductData) => {
      if (product.phases && product.phases.length > 0) {
        product.phases.forEach((phase: string) => {
          phaseCount[phase] = (phaseCount[phase] || 0) + 1;
        });
        totalWithPhases++;
      } else if (product.stage) {
        // Use stage as fallback if no phases
        phaseCount[product.stage] = (phaseCount[product.stage] || 0) + 1;
        totalWithPhases++;
      }
    });

    // Add "Uncategorized" for products without phases
    const uncategorizedCount = activityProducts.length - totalWithPhases;
    if (uncategorizedCount > 0) {
      phaseCount["Uncategorized"] = uncategorizedCount;
    }

    // Sort by count descending and take top 5
    const sortedPhases = Object.entries(phaseCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      labels: sortedPhases.map(([phase]) => phase),
      datasets: [
        {
          label: "Product Categories",
          data: sortedPhases.map(([_, count]) => count),
          backgroundColor: [
            "rgba(16, 185, 129, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(139, 92, 246, 0.7)",
            "rgba(236, 72, 153, 0.7)",
          ],
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(236, 72, 153, 1)",
          ],
        },
      ],
    };
  }, [activityProducts]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    console.log("[ProductsWidget] Data refreshed");
  };

  return (
    <div className="space-y-6" data-testid="products-widget">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          data-testid="products-refresh"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Products"
          value={countLoading ? "..." : totalProducts.toString()}
          icon={<Package className="h-4 w-4" />}
          trend={{
            value: newProductsLoading ? "..." : `${newProductsCount} new`,
            positive: true,
          }}
          isLoading={countLoading || newProductsLoading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
          data-testid="products-total-stat"
        />

        <StatsCard
          title="Product Views"
          value={
            countLoading
              ? "..."
              : (
                  activityProducts.reduce(
                    (sum, product) => sum + (product.views || 0),
                    0
                  ) || 0
                ).toString()
          }
          icon={<Eye className="h-4 w-4" />}
          isLoading={countLoading || activityLoading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
          data-testid="products-views-stat"
        />

        <StatsCard
          title="Product Likes"
          value={
            countLoading
              ? "..."
              : (
                  activityProducts.reduce(
                    (sum, product) => sum + (product.likes || 0),
                    0
                  ) || 0
                ).toString()
          }
          icon={<ThumbsUp className="h-4 w-4" />}
          isLoading={countLoading || activityLoading}
          iconBackground="bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300"
          data-testid="products-likes-stat"
        />
      </div>

      {/* Trending Products */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Products</CardTitle>
        </CardHeader>
        <CardContent>
          {trendingLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading trending products...
            </div>
          ) : trendingProducts && trendingProducts.length > 0 ? (
            <div className="space-y-4">
              {trendingProducts.map((product: ProductData, index: number) => (
                <div
                  key={product.id || index}
                  className="flex items-center gap-4"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getUserInitials(product.userName || product.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(product.updatedAt || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        by {product.userName || "Unknown User"}
                      </p>
                      <Badge variant={product.isPublic ? "default" : "outline"}>
                        {product.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No trending products found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="Product Creation Trend"
          description="New products created over time"
          chartData={productTrendData}
          type="line"
          height={250}
          isLoading={activityLoading}
        />
        <AdminChart
          title="Product Categories"
          description="Distribution of products by category"
          chartData={productCategoriesData}
          type="pie"
          height={250}
          isLoading={activityLoading}
        />
      </div>
    </div>
  );
}
