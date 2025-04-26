"use client";

import { useEffect, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  { feature: "Courses", value: 85 },
  { feature: "Q&A", value: 72 },
  { feature: "Projects", value: 68 },
  { feature: "Communities", value: 56 },
  { feature: "Resources", value: 63 },
  { feature: "Assessments", value: 78 },
];

export function PlatformUsageChart() {
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
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid opacity={0.5} />
        <PolarAngleAxis dataKey="feature" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Tooltip
          formatter={(value) => [`${value}%`, "Usage"]}
          contentStyle={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        />
        <Radar
          name="Usage"
          dataKey="value"
          stroke="var(--chart-2, #10b981)"
          fill="var(--chart-2, #10b981)"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
