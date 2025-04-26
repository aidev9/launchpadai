"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ageData = [
  { name: "18-24", value: 15 },
  { name: "25-34", value: 38 },
  { name: "35-44", value: 27 },
  { name: "45-54", value: 12 },
  { name: "55+", value: 8 },
];

const professionData = [
  { name: "Students", value: 22 },
  { name: "Developers", value: 31 },
  { name: "Data Scientists", value: 18 },
  { name: "Managers", value: 15 },
  { name: "Others", value: 14 },
];

const educationData = [
  { name: "High School", value: 8 },
  { name: "Bachelor's", value: 42 },
  { name: "Master's", value: 35 },
  { name: "PhD", value: 12 },
  { name: "Other", value: 3 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

export function UserDemographics() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  interface LabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: LabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-[280px]">
      <Tabs defaultValue="age">
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="age">Age</TabsTrigger>
            <TabsTrigger value="profession">Profession</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="age" className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ageData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="profession" className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={professionData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 45,
              }}
            >
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
              />
              <Bar dataKey="value" fill="var(--chart-4, #8b5cf6)" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="education" className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={educationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {educationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
