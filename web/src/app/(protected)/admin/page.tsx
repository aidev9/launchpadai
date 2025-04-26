"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, BarChart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AdminDashboard() {
  const [isLoading] = useState(false);

  // Demo stats - in a real app, these would be fetched from your API
  const stats = [
    {
      title: "Total Users",
      value: "2,842",
      change: "+12%",
      icon: <Users className="h-6 w-6" />,
      description: "Compared to last month",
      iconBackground:
        "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300",
    },
    {
      title: "Active Courses",
      value: "48",
      change: "+4",
      icon: <BookOpen className="h-6 w-6" />,
      description: "New courses this month",
      iconBackground:
        "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300",
    },
    {
      title: "Average Engagement",
      value: "68%",
      change: "+5.2%",
      icon: <BarChart className="h-6 w-6" />,
      description: "Sessions per user",
      iconBackground:
        "bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <Button>
          Download Report
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">{stat.change} </span>
                <span>{stat.description}</span>
              </p>
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
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse text-muted-foreground">
                  Loading...
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  User list would appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Active users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chart would appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
