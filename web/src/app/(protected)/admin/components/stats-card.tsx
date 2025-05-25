"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
  };
  isLoading?: boolean;
  iconBackground?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading = false,
  iconBackground = "bg-primary/10 text-primary",
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={`rounded-md p-2 ${iconBackground}`}>{icon}</div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-[100px]" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <Badge
              variant="outline"
              className={
                trend.positive
                  ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                  : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
              }
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
