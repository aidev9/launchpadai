"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { UserMetricsChart } from "./components/user-metrics-chart";
import { RevenueChart } from "./components/revenue-chart";
import { UserActivityMap } from "./components/user-activity-map";
import { CourseCompletionChart } from "./components/course-completion-chart";
import { PlatformUsageChart } from "./components/platform-usage-chart";
import { TopCourses } from "./components/top-courses";
import { UserDemographics } from "./components/user-demographics";
import { ConversionFunnelChart } from "./components/conversion-funnel-chart";
import { RetentionHeatmapChart } from "./components/retention-heatmap";
import { MetricsComparison } from "./components/metrics-comparison";

export default function AdminAnalytics() {
  const [timeframe, setTimeframe] = useState<string>("30d");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for the entire platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Top metrics cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">27,482</div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>+12.5% </span>
                  <span className="text-muted-foreground ml-1">
                    vs. last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Active Users
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,395</div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>+18.2% </span>
                  <span className="text-muted-foreground ml-1">
                    vs. last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$832,459</div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  <span>+24.3% </span>
                  <span className="text-muted-foreground ml-1">
                    vs. last period
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Course Completion Rate
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68.4%</div>
                <div className="flex items-center text-xs text-red-500">
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                  <span>-2.7% </span>
                  <span className="text-muted-foreground ml-1">
                    vs. last period
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts - First Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User Growth & Retention</CardTitle>
                <CardDescription>
                  New user acquisition and retention rates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <UserMetricsChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Revenue sources and trends</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <RevenueChart />
              </CardContent>
            </Card>
          </div>

          {/* Charts - Second Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>
                  User distribution by country, age, and profession
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserDemographics />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Global User Distribution</CardTitle>
                <CardDescription>
                  Geographic distribution of platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserActivityMap />
              </CardContent>
            </Card>
          </div>

          {/* Charts - Third Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Course Completion</CardTitle>
                <CardDescription>
                  Average completion rates by course type
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <CourseCompletionChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Usage</CardTitle>
                <CardDescription>
                  Activity distribution across platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <PlatformUsageChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Courses</CardTitle>
                <CardDescription>
                  Most popular courses by enrollment
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <TopCourses />
              </CardContent>
            </Card>
          </div>

          {/* Charts - Fourth Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>
                  User journey from registration to paid subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ConversionFunnelChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Retention Heatmap</CardTitle>
                <CardDescription>
                  Cohort retention analysis over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <RetentionHeatmapChart />
              </CardContent>
            </Card>
          </div>

          {/* Charts - Fifth Row */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Comparison</CardTitle>
              <CardDescription>
                Year-over-year comparison of critical business metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <MetricsComparison />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                Detailed user statistics and behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px] w-full flex items-center justify-center border rounded">
                <p className="text-muted-foreground">
                  User analytics content would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>
                Analytics related to course performance and engagement
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px] w-full flex items-center justify-center border rounded">
                <p className="text-muted-foreground">
                  Course analytics content would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Detailed revenue analysis and financial metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[400px] w-full flex items-center justify-center border rounded">
                <p className="text-muted-foreground">
                  Revenue analytics content would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
