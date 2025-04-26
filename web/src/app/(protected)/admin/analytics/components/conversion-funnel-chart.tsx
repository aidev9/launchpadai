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
  LabelList,
} from "recharts";

const data = [
  { name: "Visitors", value: 100, label: "100%" },
  { name: "Sign-ups", value: 42, label: "42%" },
  { name: "Course Views", value: 36, label: "36%" },
  { name: "Course Starts", value: 28, label: "28%" },
  { name: "Free Complete", value: 18, label: "18%" },
  { name: "Trial", value: 12, label: "12%" },
  { name: "Subscribers", value: 8, label: "8%" },
];

export function ConversionFunnelChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          opacity={0.3}
        />
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          dataKey="name"
          type="category"
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => `${value}%`}
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        />
        <Bar
          dataKey="value"
          fill="var(--chart-3, #f59e0b)"
          radius={[0, 4, 4, 0]}
        >
          <LabelList dataKey="label" position="right" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
