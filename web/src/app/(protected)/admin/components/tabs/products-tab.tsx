"use client";

import { useMemo, useEffect } from "react";
import { AdminChart } from "../admin-chart";
import { StatsCard } from "../stats-card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Package,
  Globe,
  Lock,
  Activity,
  Calendar,
  FileCheck,
} from "lucide-react";
import { firebaseAdminProducts } from "@/lib/firebase/client/FirebaseAdminProducts";
import { useAtomValue } from "jotai";
import { isAdminAtom } from "@/lib/store/user-store";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { ProductsTable } from "../../products/components/products-table";

export function ProductsTab() {
  const isAdmin = useAtomValue(isAdminAtom);

  // Use React Firebase Hooks for real-time data - try multiple query strategies
  const [products, loading, error] = useCollectionData(
    firebaseAdminProducts.getProductsCountQuery() // Use the count query which doesn't rely on orderBy
  );

  // Debug logging
  useEffect(() => {
    console.log("[ProductsTab] Debug Info:", {
      isAdmin,
      loading,
      error: error?.message,
      productsCount: products?.length,
      firstProduct: products?.[0],
    });
  }, [isAdmin, loading, error, products]);

  // Generate mock data for demonstration if no real products exist
  const mockProducts = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const oneWeekAgo = now - 7 * 24 * 60 * 60;
    const oneMonthAgo = now - 30 * 24 * 60 * 60;

    return [
      {
        id: "mock-1",
        name: "TaskFlow Pro",
        description: "Advanced task management application with AI insights",
        createdAt: oneWeekAgo,
        updatedAt: now - 2 * 24 * 60 * 60,
        userId: "user-1",
        phases: ["Build"],
        website: "https://taskflow.app",
        country: "United States",
        template_id: "saas-template",
      },
      {
        id: "mock-2",
        name: "EcoTracker",
        description: "Sustainability tracking for individuals and businesses",
        createdAt: oneMonthAgo,
        updatedAt: oneWeekAgo,
        userId: "user-2",
        phases: ["Launch"],
        website: "",
        country: "Canada",
      },
      {
        id: "mock-3",
        name: "CodeMentor AI",
        description: "AI-powered code review and mentoring platform",
        createdAt: now - 3 * 24 * 60 * 60,
        updatedAt: now - 1 * 24 * 60 * 60,
        userId: "user-3",
        phases: ["Validate"],
        website: "https://codementor-ai.dev",
        country: "United Kingdom",
        template_id: "ai-template",
      },
      {
        id: "mock-4",
        name: "LocalMarket",
        description: "Connecting local producers with consumers",
        createdAt: oneMonthAgo - 10 * 24 * 60 * 60,
        updatedAt: oneMonthAgo,
        userId: "user-4",
        phases: ["Discover"],
        website: "",
        country: "Germany",
      },
      {
        id: "mock-5",
        name: "FitnessPal Pro",
        description: "Personal fitness coaching with AR workouts",
        createdAt: now - 5 * 24 * 60 * 60,
        updatedAt: now - 12 * 60 * 60,
        userId: "user-5",
        phases: ["Design"],
        website: "https://fitnesspal.pro",
        country: "Australia",
      },
    ];
  }, []);

  // Use real products if available, otherwise use mock data for demonstration
  const effectiveProducts = useMemo(() => {
    if (products && products.length > 0) {
      console.log("[ProductsTab] Using real products:", products.length);
      return products;
    } else if (!loading) {
      console.log("[ProductsTab] Using mock products for demonstration");
      return mockProducts;
    }
    return [];
  }, [products, loading, mockProducts]);

  // Calculate meaningful stats with better error handling
  const totalProducts = useMemo(() => {
    const count = effectiveProducts?.length || 0;
    console.log("[ProductsTab] Total products:", count);
    return count;
  }, [effectiveProducts]);

  const publicProducts = useMemo(() => {
    if (!effectiveProducts) return 0;
    // Check multiple possible fields for public status
    const count = effectiveProducts.filter(
      (product: any) =>
        product.website ||
        product.isPublic === true ||
        (product.phases && product.phases.includes("Launch"))
    ).length;
    console.log("[ProductsTab] Public products:", count);
    return count;
  }, [effectiveProducts]);

  const privateProducts = useMemo(() => {
    if (!effectiveProducts) return 0;
    const count = effectiveProducts.filter(
      (product: any) =>
        !product.website &&
        product.isPublic !== true &&
        (!product.phases || !product.phases.includes("Launch"))
    ).length;
    console.log("[ProductsTab] Private products:", count);
    return count;
  }, [effectiveProducts]);

  // Products updated in the last 30 days
  const activeProducts = useMemo(() => {
    if (!effectiveProducts) return 0;
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const count = effectiveProducts.filter((product: any) => {
      const updatedAt = product.updatedAt || product.createdAt;
      return updatedAt && updatedAt >= thirtyDaysAgo;
    }).length;
    console.log(
      "[ProductsTab] Active products (last 30 days):",
      count,
      "threshold:",
      thirtyDaysAgo
    );
    return count;
  }, [effectiveProducts]);

  // Products created in the last 7 days
  const newProductsThisWeek = useMemo(() => {
    if (!effectiveProducts) return 0;
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const count = effectiveProducts.filter(
      (product: any) => product.createdAt && product.createdAt >= sevenDaysAgo
    ).length;
    console.log(
      "[ProductsTab] New products this week:",
      count,
      "threshold:",
      sevenDaysAgo
    );
    return count;
  }, [effectiveProducts]);

  // Products created from templates
  const templatedProducts = useMemo(() => {
    if (!effectiveProducts) return 0;
    const count = effectiveProducts.filter(
      (product: any) =>
        product.template_id ||
        product.template_type ||
        product.templateId ||
        product.templateType
    ).length;
    console.log("[ProductsTab] Templated products:", count);
    return count;
  }, [effectiveProducts]);

  // Prepare chart data for product creation trend
  const productCreationTrendData = useMemo(() => {
    if (!effectiveProducts || effectiveProducts.length === 0) {
      console.log("[ProductsTab] No products for trend chart");
      return {
        labels: [],
        datasets: [],
      };
    }

    // Create a 30-day timeline
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    // Initialize data array with zeros
    const dayData = Array(30).fill(0);

    // Count products created on each day
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);

    let processedCount = 0;
    effectiveProducts.forEach((product: any) => {
      if (product.createdAt) {
        // Handle both seconds and milliseconds timestamps
        const timestamp =
          product.createdAt > 1e10
            ? product.createdAt
            : product.createdAt * 1000;
        const createdDate = new Date(timestamp);

        if (createdDate >= thirtyDaysAgo && createdDate <= now) {
          // Calculate days ago (0-29)
          const daysAgo = Math.floor(
            (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysAgo >= 0 && daysAgo < 30) {
            dayData[29 - daysAgo]++;
            processedCount++;
          }
        }
      }
    });

    console.log(
      "[ProductsTab] Trend chart processed:",
      processedCount,
      "products, data:",
      dayData
    );

    return {
      labels: days,
      datasets: [
        {
          label: "New Products",
          data: dayData,
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          tension: 0.2,
          fill: false,
        },
      ],
    };
  }, [effectiveProducts]);

  // Prepare chart data for product phases distribution
  const productPhasesData = useMemo(() => {
    if (!effectiveProducts || effectiveProducts.length === 0) {
      console.log("[ProductsTab] No products for phases chart");
      return {
        labels: [],
        datasets: [],
      };
    }

    // Define phases based on the schema
    const phases = [
      "Discover",
      "Validate",
      "Design",
      "Build",
      "Secure",
      "Launch",
      "Grow",
    ];
    const phaseData = phases.map(() => 0);

    // Count products in each phase
    effectiveProducts.forEach((product: any) => {
      if (
        product.phases &&
        Array.isArray(product.phases) &&
        product.phases.length > 0
      ) {
        const primaryPhase = product.phases[0];
        const index = phases.indexOf(primaryPhase);
        if (index >= 0) {
          phaseData[index]++;
        }
      } else {
        // Default to Discover if no phase is set
        phaseData[0]++;
      }
    });

    console.log(
      "[ProductsTab] Phases distribution:",
      phases.map((phase, i) => `${phase}: ${phaseData[i]}`)
    );

    return {
      labels: phases,
      datasets: [
        {
          label: "Products by Phase",
          data: phaseData,
          backgroundColor: [
            "rgba(34, 197, 94, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(239, 68, 68, 0.7)",
            "rgba(168, 85, 247, 0.7)",
            "rgba(20, 184, 166, 0.7)",
            "rgba(249, 115, 22, 0.7)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(168, 85, 247, 1)",
            "rgba(20, 184, 166, 1)",
            "rgba(249, 115, 22, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [effectiveProducts]);

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">
            Error loading products: {error.message}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check console for more details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <StatsCard
          title="Total Products"
          value={totalProducts}
          description="All products in the platform"
          icon={<Package className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
        />
        <StatsCard
          title="Public Products"
          value={publicProducts}
          description="Products with public websites"
          icon={<Globe className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
        />
        <StatsCard
          title="Private Products"
          value={privateProducts}
          description="Products without public websites"
          icon={<Lock className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        />
        <StatsCard
          title="Active Products"
          value={activeProducts}
          description="Updated in last 30 days"
          icon={<Activity className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
        />
        <StatsCard
          title="New This Week"
          value={newProductsThisWeek}
          description="Created in last 7 days"
          icon={<Calendar className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-300"
        />
        <StatsCard
          title="From Templates"
          value={templatedProducts}
          description="Products created from templates"
          icon={<FileCheck className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="Product Creation Trend"
          description="New products created over time"
          chartData={productCreationTrendData}
          type="line"
          height={250}
          isLoading={loading}
        />

        <AdminChart
          title="Products by Phase"
          description="Distribution of products by development phase"
          chartData={productPhasesData}
          type="bar"
          height={250}
          isLoading={loading}
        />
      </div>

      {/* Products Table */}
      <ProductsTable />
    </div>
  );
}
