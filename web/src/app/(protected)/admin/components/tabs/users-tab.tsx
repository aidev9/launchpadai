"use client";

import { useMemo } from "react";
import { AdminChart } from "../admin-chart";
import { StatsCard } from "../stats-card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users as UsersIcon, UserPlus } from "lucide-react";
import { UsersTable } from "../../users/components/users-table";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseAdminUsers } from "@/lib/firebase/client/FirebaseAdminUsers";

export function UsersTab() {
  // Use React Firebase Hooks for real-time data to calculate stats
  const [users, loading, error] = useCollectionData(
    firebaseAdminUsers.getUsersQuery(1000) // Get more users for stats calculations
  );

  // Calculate active users (users who logged in within last 30 days)
  const activeUsersCount = useMemo(() => {
    if (!users) return 0;

    const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
    return users.filter(
      (user) => user.lastLogin && user.lastLogin >= thirtyDaysAgo
    ).length;
  }, [users]);

  // Calculate new users in the last 7 days
  const newUsersLast7Days = useMemo(() => {
    if (!users) return 0;

    const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 60 * 60;
    return users.filter((user) => user.createdAt >= sevenDaysAgo).length;
  }, [users]);

  // Calculate average XP more robustly
  const averageXP = useMemo(() => {
    if (!users || users.length === 0) return 0;

    const totalXP = users.reduce((sum, user) => sum + (user.xp || 0), 0);
    return Math.round(totalXP / users.length);
  }, [users]);

  // Calculate admin users count
  const adminUsersCount = useMemo(() => {
    if (!users) return 0;
    return users.filter(
      (user) => user.userType === "admin" || user.userType === "superadmin"
    ).length;
  }, [users]);

  // Prepare chart data for user growth based on real user data
  const userGrowthData = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Create activity data from user creation dates for the last 30 days
    const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
    const activityMap = new Map();

    // Initialize the last 30 days with zero counts
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      activityMap.set(dateStr, 0);
    }

    // Count user signups by day
    users.forEach((user) => {
      if (user.createdAt && user.createdAt >= thirtyDaysAgo) {
        const date = new Date(user.createdAt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (activityMap.has(dateStr)) {
          activityMap.set(dateStr, activityMap.get(dateStr) + 1);
        }
      }
    });

    const labels = Array.from(activityMap.keys());
    const data = Array.from(activityMap.values());

    return {
      labels,
      datasets: [
        {
          label: "New Users",
          data,
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          tension: 0.2,
        },
      ],
    };
  }, [users]);

  // Prepare chart data for user XP distribution
  const userXpDistributionData = useMemo(() => {
    if (!users || users.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Define XP ranges
    const xpRanges = [
      { label: "Beginner (0-100)", min: 0, max: 100 },
      { label: "Intermediate (101-500)", min: 101, max: 500 },
      { label: "Advanced (501-1000)", min: 501, max: 1000 },
      { label: "Expert (1000+)", min: 1001, max: Infinity },
    ];

    const distribution = xpRanges.map((range) => {
      return users.filter((user) => {
        const xp = user.xp || 0;
        return xp >= range.min && xp <= range.max;
      }).length;
    });

    return {
      labels: xpRanges.map((range) => range.label),
      datasets: [
        {
          label: "User Distribution by XP",
          data: distribution,
          backgroundColor: [
            "rgba(34, 197, 94, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <UserPlus className="h-4 w-4" />
            <span>Invite User</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatsCard
          title="Total Users"
          value={users?.length || 0}
          icon={<UsersIcon className="h-4 w-4" />}
          isLoading={loading}
          iconBackground="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
        />
        <StatsCard
          title="Active Users"
          value={activeUsersCount}
          description="Users active in the last 30 days"
          isLoading={loading}
          iconBackground="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300"
        />
        <StatsCard
          title="New Users"
          value={newUsersLast7Days}
          description="New registrations in last 7 days"
          isLoading={loading}
          iconBackground="bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300"
        />
        <StatsCard
          title="Admin Users"
          value={adminUsersCount}
          isLoading={loading}
          iconBackground="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300"
        />
        <StatsCard
          title="Average XP"
          value={averageXP}
          isLoading={loading}
          iconBackground="bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300"
        />
      </div>

      {/* User Growth Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminChart
          title="User Growth"
          description="New user registrations over time"
          chartData={userGrowthData}
          type="line"
          height={250}
          isLoading={loading}
        />

        {/* User XP Distribution Chart */}
        <AdminChart
          title="User XP Distribution"
          description="Distribution of users by XP levels"
          chartData={userXpDistributionData}
          type="bar"
          height={250}
          isLoading={loading}
        />
      </div>

      {/* Users Table */}
      <UsersTable />
    </div>
  );
}
