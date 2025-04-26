"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Users,
  Layers,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import Link from "next/link";

// Mock data for dashboard charts and stats
const activityData = [
  { name: "Jan", users: 400, courses: 240 },
  { name: "Feb", users: 300, courses: 139 },
  { name: "Mar", users: 200, courses: 980 },
  { name: "Apr", users: 278, courses: 390 },
  { name: "May", users: 189, courses: 480 },
  { name: "Jun", users: 239, courses: 380 },
  { name: "Jul", users: 349, courses: 430 },
];

const subscriptionData = [
  { name: "Free", value: 4000 },
  { name: "Pro", value: 3000 },
  { name: "Enterprise", value: 2000 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform metrics, user activity, and course engagement.
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,823</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-emerald-500 flex items-center mr-1 text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                12%
              </span>
              from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/admin/users"
              className="text-xs text-blue-500 hover:underline"
            >
              View details
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-emerald-500 flex items-center mr-1 text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                4%
              </span>
              from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/admin/courses"
              className="text-xs text-blue-500 hover:underline"
            >
              View details
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pro Subscriptions
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">482</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-rose-500 flex items-center mr-1 text-xs">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                3%
              </span>
              from last month
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/admin/users?filter=pro"
              className="text-xs text-blue-500 hover:underline"
            >
              View details
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Daily Active Users
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-emerald-500 flex items-center mr-1 text-xs">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                18%
              </span>
              from last week
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/admin/analytics"
              className="text-xs text-blue-500 hover:underline"
            >
              View details
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Activity</CardTitle>
          <CardDescription>
            User signups and course enrollments over the past 7 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Bar dataKey="users" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="courses" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              New users who joined in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm">
                  <th className="text-left font-medium p-2">Name</th>
                  <th className="text-left font-medium p-2">Email</th>
                  <th className="text-left font-medium p-2">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Alex Johnson",
                    email: "alex@example.com",
                    subscription: "Free",
                  },
                  {
                    name: "Sarah Miller",
                    email: "sarah@example.com",
                    subscription: "Pro",
                  },
                  {
                    name: "Jamie Wilson",
                    email: "jamie@example.com",
                    subscription: "Enterprise",
                  },
                  {
                    name: "Taylor Brown",
                    email: "taylor@example.com",
                    subscription: "Free",
                  },
                  {
                    name: "Morgan Davis",
                    email: "morgan@example.com",
                    subscription: "Pro",
                  },
                ].map((user, i) => (
                  <tr key={i} className="border-b text-sm">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.subscription === "Free"
                            ? "bg-slate-100"
                            : user.subscription === "Pro"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {user.subscription}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Popular Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Courses</CardTitle>
            <CardDescription>Most enrolled courses this month</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm">
                  <th className="text-left font-medium p-2">Course</th>
                  <th className="text-left font-medium p-2">Enrollments</th>
                  <th className="text-left font-medium p-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Introduction to AI", enrollments: 245, rating: 4.8 },
                  {
                    name: "Web Development Basics",
                    enrollments: 189,
                    rating: 4.6,
                  },
                  {
                    name: "Data Science Fundamentals",
                    enrollments: 176,
                    rating: 4.9,
                  },
                  {
                    name: "UX Design Principles",
                    enrollments: 154,
                    rating: 4.7,
                  },
                  {
                    name: "Mobile App Development",
                    enrollments: 132,
                    rating: 4.5,
                  },
                ].map((course, i) => (
                  <tr key={i} className="border-b text-sm">
                    <td className="p-2">{course.name}</td>
                    <td className="p-2">{course.enrollments}</td>
                    <td className="p-2">⭐ {course.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
