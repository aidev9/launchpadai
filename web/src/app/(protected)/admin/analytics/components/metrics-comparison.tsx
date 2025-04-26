"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const data = [
  {
    name: "Users",
    current: 27482,
    previous: 22145,
    growth: 24.1,
  },
  {
    name: "Revenue",
    current: 832459,
    previous: 671238,
    growth: 24.0,
  },
  {
    name: "Courses",
    current: 154,
    previous: 98,
    growth: 57.1,
  },
  {
    name: "Avg Session",
    current: 28,
    previous: 22,
    growth: 27.3,
  },
  {
    name: "Completion",
    current: 68,
    previous: 64,
    growth: 6.3,
  },
  {
    name: "Engagement",
    current: 72,
    previous: 61,
    growth: 18.0,
  },
];

export function MetricsComparison() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  // Format values for tooltip based on metric name
  const formatValue = (value: number, name: string): string => {
    if (name === "Revenue") {
      return `$${value.toLocaleString()}`;
    } else if (["Completion", "Engagement"].includes(name)) {
      return `${value}%`;
    } else if (name === "Avg Session") {
      return `${value} min`;
    } else {
      return value.toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className="h-3 w-3 mr-2 bg-blue-500 rounded"></div>
            <span>2025 (Current)</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 mr-2 bg-gray-400 rounded"></div>
            <span>2024 (Previous)</span>
          </div>
        </div>
        <div className="text-muted-foreground italic">
          Year-over-year comparison
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            domain={[-50, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value, name, props) => {
              const metricName = props.payload.name;
              const numericValue =
                typeof value === "number" ? value : Number(value);
              return [
                formatValue(numericValue, metricName),
                name === "current" ? "2025" : "2024",
              ];
            }}
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="previous"
            name="2024"
            fill="#9ca3af"
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
          <Bar
            yAxisId="left"
            dataKey="current"
            name="2025"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={30}
          />

          {/* Growth percentage markers */}
          <Bar
            yAxisId="right"
            dataKey="growth"
            radius={[4, 4, 0, 0]}
            fill="none"
            label={(props) => {
              const { x, y, width, height: _height, value } = props;

              // Make sure x and width are valid numbers before using them
              const xPos = typeof x === "number" && !isNaN(x) ? x : 0;
              const widthVal =
                typeof width === "number" && !isNaN(width) ? width : 0;
              const yPos = typeof y === "number" && !isNaN(y) ? y - 10 : 0;

              return (
                <text
                  x={xPos + widthVal / 2}
                  y={yPos}
                  textAnchor="middle"
                  fill={value > 0 ? "#10b981" : "#ef4444"}
                  className="text-xs"
                >
                  {value > 0 ? `+${value}%` : `${value}%`}
                </text>
              );
            }}
          />
          <ReferenceLine yAxisId="right" y={0} stroke="#888" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
