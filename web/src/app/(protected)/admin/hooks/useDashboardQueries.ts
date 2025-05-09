"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getTotalUsers,
  getTotalCourses,
  getRecentSignups,
  getRecentProducts,
  getRecentPrompts,
  getUserActivityData,
} from "../actions/dashboard";
import { User, Product, Prompt, ActivityData } from "../types/dashboard";
import { useAtomValue } from "jotai";
import { dashboardRefreshTriggerAtom } from "../dashboard-store";

// Query keys for caching and invalidation
export const dashboardKeys = {
  all: ["dashboard"] as const,
  totalUsers: () => [...dashboardKeys.all, "totalUsers"] as const,
  totalCourses: () => [...dashboardKeys.all, "totalCourses"] as const,
  recentSignups: (limit: number) =>
    [...dashboardKeys.all, "recentSignups", limit] as const,
  recentProducts: (limit: number) =>
    [...dashboardKeys.all, "recentProducts", limit] as const,
  recentPrompts: (limit: number) =>
    [...dashboardKeys.all, "recentPrompts", limit] as const,
  userActivity: (days: number) =>
    [...dashboardKeys.all, "userActivity", days] as const,
};

// Hook for fetching total users count
export function useTotalUsers() {
  const refreshTrigger = useAtomValue(dashboardRefreshTriggerAtom);

  return useQuery({
    queryKey: [...dashboardKeys.totalUsers(), refreshTrigger],
    queryFn: async () => {
      const result = await getTotalUsers();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch total users");
      }
      return result.count;
    },
  });
}

// Hook for fetching total courses count
export function useTotalCourses() {
  const refreshTrigger = useAtomValue(dashboardRefreshTriggerAtom);

  return useQuery({
    queryKey: [...dashboardKeys.totalCourses(), refreshTrigger],
    queryFn: async () => {
      const result = await getTotalCourses();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch total courses");
      }
      return result.count;
    },
  });
}

// Hook for fetching recent signups
export function useRecentSignups(limit = 5) {
  const refreshTrigger = useAtomValue(dashboardRefreshTriggerAtom);

  return useQuery<User[]>({
    queryKey: [...dashboardKeys.recentSignups(limit), refreshTrigger],
    queryFn: async () => {
      const result = await getRecentSignups(limit);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch recent signups");
      }
      return result.users as User[];
    },
  });
}

// Hook for fetching recent products
export function useRecentProducts(limit = 20) {
  const refreshTrigger = useAtomValue(dashboardRefreshTriggerAtom);

  return useQuery<Product[]>({
    queryKey: [...dashboardKeys.recentProducts(limit), refreshTrigger],
    queryFn: async () => {
      const result = await getRecentProducts(limit);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch recent products");
      }
      return result.products as Product[];
    },
  });
}

// Hook for fetching recent prompts
export function useRecentPrompts(limit = 20) {
  const refreshTrigger = useAtomValue(dashboardRefreshTriggerAtom);

  return useQuery<Prompt[]>({
    queryKey: [...dashboardKeys.recentPrompts(limit), refreshTrigger],
    queryFn: async () => {
      const result = await getRecentPrompts(limit);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch recent prompts");
      }
      return result.prompts as Prompt[];
    },
  });
}

// Hook for fetching user activity data
export function useUserActivityData(days = 14) {
  const refreshTrigger = useAtomValue(dashboardRefreshTriggerAtom);

  return useQuery<ActivityData[]>({
    queryKey: [...dashboardKeys.userActivity(days), refreshTrigger],
    queryFn: async () => {
      const result = await getUserActivityData(days);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user activity data");
      }
      return result.activityData as ActivityData[];
    },
  });
}
