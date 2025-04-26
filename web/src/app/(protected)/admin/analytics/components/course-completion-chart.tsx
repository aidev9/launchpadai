"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { category: "AI Basics", completion: 78 },
  { category: "Data Science", completion: 65 },
  { category: "ML", completion: 59 },
  { category: "NLP", completion: 51 },
  { category: "Computer Vision", completion: 48 },
  { category: "Ethics", completion: 82 },
];

export function CourseCompletionChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[240px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          opacity={0.3}
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          dataKey="category"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Completion Rate"]}
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        />
        <Bar
          dataKey="completion"
          fill="var(--chart-1, #3b82f6)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
