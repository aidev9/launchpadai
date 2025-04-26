"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", newUsers: 1200, activeUsers: 4500, churnedUsers: 320 },
  { month: "Feb", newUsers: 1400, activeUsers: 5100, churnedUsers: 350 },
  { month: "Mar", newUsers: 1600, activeUsers: 6200, churnedUsers: 410 },
  { month: "Apr", newUsers: 1800, activeUsers: 6900, churnedUsers: 390 },
  { month: "May", newUsers: 2200, activeUsers: 7800, churnedUsers: 420 },
  { month: "Jun", newUsers: 2600, activeUsers: 8500, churnedUsers: 510 },
  { month: "Jul", newUsers: 2900, activeUsers: 9100, churnedUsers: 580 },
  { month: "Aug", newUsers: 3100, activeUsers: 9800, churnedUsers: 610 },
  { month: "Sep", newUsers: 3400, activeUsers: 10200, churnedUsers: 590 },
  { month: "Oct", newUsers: 3700, activeUsers: 11000, churnedUsers: 620 },
  { month: "Nov", newUsers: 4000, activeUsers: 11800, churnedUsers: 650 },
  { month: "Dec", newUsers: 4300, activeUsers: 12500, churnedUsers: 680 },
];

export function UserMetricsChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="newUsers"
          stroke="var(--chart-1, #3b82f6)"
          strokeWidth={2}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="activeUsers"
          stroke="var(--chart-2, #10b981)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="churnedUsers"
          stroke="var(--chart-3, #ef4444)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
