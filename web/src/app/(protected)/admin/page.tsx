"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  Package,
  Lightbulb,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InviteUserDialog } from "./users/components/invite-user-dialog";
import { inviteDialogOpenAtom } from "./users/users-store";
import { useAtom } from "jotai";
import {
  useTotalUsers,
  useTotalCourses,
  useRecentSignups,
  useRecentProducts,
  useRecentPrompts,
  useUserActivityData,
} from "./hooks/useDashboardQueries";
import {
  QueryStateHandler,
  UserListLoadingSkeleton,
  ActivityChartLoadingSkeleton,
  ProductsGridLoadingSkeleton,
} from "./components/query-state-handler";
import { User, Product, Prompt } from "./types/dashboard";
import { useRouter } from "next/navigation";
import { currentUserAtom } from "./users/users-store";
import {
  selectedDashboardUserAtom,
  dashboardRefreshTriggerAtom,
} from "./dashboard-store";

export default function AdminDashboard() {
  const [inviteDialogOpen, setInviteDialogOpen] = useAtom(inviteDialogOpenAtom);
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const [, setSelectedDashboardUser] = useAtom(selectedDashboardUserAtom);
  const [refreshTrigger, setRefreshTrigger] = useAtom(
    dashboardRefreshTriggerAtom
  );
  const router = useRouter();

  // Use Tanstack Query hooks for data fetching
  const totalUsersQuery = useTotalUsers();
  const totalCoursesQuery = useTotalCourses();
  const recentSignupsQuery = useRecentSignups(5);
  const recentProductsQuery = useRecentProducts(20);
  const recentPromptsQuery = useRecentPrompts(20);
  const userActivityQuery = useUserActivityData(14);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle user click
  const handleUserClick = (user: User) => {
    setCurrentUser(user as any);
    router.push("/admin/users/user");
  };

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US");
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

  // Stats cards data
  const stats = [
    {
      title: "Total Users",
      value: totalUsersQuery.isLoading
        ? "..."
        : formatNumber(totalUsersQuery.data || 0),
      change: "+12%",
      icon: <Users className="h-6 w-6" />,
      description: "Compared to last month",
      iconBackground:
        "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300",
      isLoading: totalUsersQuery.isLoading,
      isError: totalUsersQuery.isError,
      error: totalUsersQuery.error as Error | null,
    },
    {
      title: "Active Courses",
      value: totalCoursesQuery.isLoading
        ? "..."
        : formatNumber(totalCoursesQuery.data || 0),
      change: "+4",
      icon: <BookOpen className="h-6 w-6" />,
      description: "New courses this month",
      iconBackground:
        "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300",
      isLoading: totalCoursesQuery.isLoading,
      isError: totalCoursesQuery.isError,
      error: totalCoursesQuery.error as Error | null,
    },
    {
      title: "Recent Products",
      value: recentProductsQuery.isLoading
        ? "..."
        : formatNumber(recentProductsQuery.data?.length || 0),
      change: "+8",
      icon: <Package className="h-6 w-6" />,
      description: "New products this week",
      iconBackground:
        "bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300",
      isLoading: recentProductsQuery.isLoading,
      isError: recentProductsQuery.isError,
      error: recentProductsQuery.error as Error | null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: "Admin", href: "", isCurrentPage: true }]}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.iconBackground}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <QueryStateHandler
                isLoading={stat.isLoading}
                isError={stat.isError}
                error={stat.error}
                loadingComponent={<div className="text-2xl font-bold">...</div>}
                errorTitle={`Error loading ${stat.title.toLowerCase()}`}
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500">{stat.change} </span>
                  <span>{stat.description}</span>
                </p>
              </QueryStateHandler>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional dashboard content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sign-ups</CardTitle>
            <CardDescription>New users in the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              isLoading={recentSignupsQuery.isLoading}
              isError={recentSignupsQuery.isError}
              error={recentSignupsQuery.error as Error | null}
              loadingComponent={<UserListLoadingSkeleton />}
              errorTitle="Error loading recent sign-ups"
            >
              {recentSignupsQuery.data && recentSignupsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {recentSignupsQuery.data.map((user: User) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-4 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleUserClick(user)}
                    >
                      <Avatar className="h-10 w-10">
                        {user.photoURL ? (
                          <AvatarImage
                            src={user.photoURL}
                            alt={user.displayName || ""}
                          />
                        ) : null}
                        <AvatarFallback>
                          {getUserInitials(
                            user.displayName || user.email || "U"
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.displayName || user.email || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(user.createdAt)}
                        </p>
                      </div>
                      {user.subscription && (
                        <Badge variant="outline" className="ml-auto">
                          {typeof user.subscription === "string"
                            ? user.subscription
                            : (user.subscription as any).planType || "free"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent sign-ups</p>
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Sign-ups, products, and prompts</CardDescription>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              isLoading={userActivityQuery.isLoading}
              isError={userActivityQuery.isError}
              error={userActivityQuery.error as Error | null}
              loadingComponent={<ActivityChartLoadingSkeleton />}
              errorTitle="Error loading user activity data"
            >
              {userActivityQuery.data && userActivityQuery.data.length > 0 ? (
                <div className="h-[200px] w-full">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Activity data available for charting
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {userActivityQuery.data.length} days of data with{" "}
                      {userActivityQuery.data.reduce(
                        (sum, day) => sum + day.signups,
                        0
                      )}{" "}
                      sign-ups,{" "}
                      {userActivityQuery.data.reduce(
                        (sum, day) => sum + day.products,
                        0
                      )}{" "}
                      products, and{" "}
                      {userActivityQuery.data.reduce(
                        (sum, day) => sum + day.prompts,
                        0
                      )}{" "}
                      prompts
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No activity data available
                  </p>
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products and Recent Prompts in full-width cards */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>
                Latest products created by users
              </CardDescription>
            </div>
            <Badge variant="outline">
              {recentProductsQuery.data?.length || 0} products
            </Badge>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              isLoading={recentProductsQuery.isLoading}
              isError={recentProductsQuery.isError}
              error={recentProductsQuery.error as Error | null}
              loadingComponent={<ProductsGridLoadingSkeleton />}
              errorTitle="Error loading recent products"
            >
              {recentProductsQuery.data &&
              recentProductsQuery.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProductsQuery.data.map((product: Product) => (
                    <div key={product.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate max-w-[200px]">
                          {product.name || "Unnamed Product"}
                        </h4>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {formatDate(product.createdAt)}
                        </Badge>
                      </div>
                      {product.user && (
                        <div
                          className="flex items-center mt-2 cursor-pointer hover:text-blue-500"
                          onClick={() =>
                            product.user &&
                            handleUserClick(product.user as User)
                          }
                        >
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(product.user.displayName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {product.user.displayName ||
                              product.user.email ||
                              "Unknown user"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent products</p>
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Prompts</CardTitle>
              <CardDescription>Latest prompts created by users</CardDescription>
            </div>
            <Badge variant="outline">
              {recentPromptsQuery.data?.length || 0} prompts
            </Badge>
          </CardHeader>
          <CardContent>
            <QueryStateHandler
              isLoading={recentPromptsQuery.isLoading}
              isError={recentPromptsQuery.isError}
              error={recentPromptsQuery.error as Error | null}
              loadingComponent={<ProductsGridLoadingSkeleton />}
              errorTitle="Error loading recent prompts"
            >
              {recentPromptsQuery.data && recentPromptsQuery.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentPromptsQuery.data.map((prompt: Prompt) => (
                    <div key={prompt.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate max-w-[200px]">
                          {prompt.title || "Unnamed Prompt"}
                        </h4>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {formatDate(prompt.createdAt)}
                        </Badge>
                      </div>
                      {prompt.user && (
                        <div
                          className="flex items-center mt-2 cursor-pointer hover:text-blue-500"
                          onClick={() =>
                            prompt.user && handleUserClick(prompt.user as User)
                          }
                        >
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(prompt.user.displayName || "")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {prompt.user.displayName ||
                              prompt.user.email ||
                              "Unknown user"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent prompts</p>
                </div>
              )}
            </QueryStateHandler>
          </CardContent>
        </Card>
      </div>

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
