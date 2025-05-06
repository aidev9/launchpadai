"use client";

import React from "react";
import { Pie, PieChart, Cell } from "recharts";
import { Card } from "@/components/ui/card";

interface ScoreWidgetProps {
  score: number;
  title: string;
  description: string;
  lowScoreMessage: string;
  highScoreMessage: string;
  color?: string; // Optional color override
}

export function ScoreWidget({
  score,
  title,
  description,
  lowScoreMessage,
  highScoreMessage,
  color,
}: ScoreWidgetProps) {
  // Ensure score is between 0 and 100
  const validScore = Math.max(0, Math.min(100, score));

  // Data for the pie chart
  const data = [
    { name: "Score", value: validScore },
    { name: "Remaining", value: 100 - validScore },
  ];

  // Get color based on score
  const getScoreColor = (score: number, forText: boolean = false) => {
    if (color && forText) return `text-${color}-500`;

    if (score >= 80) return forText ? "text-green-500" : "#10b981"; // Green
    if (score >= 60) return forText ? "text-yellow-500" : "#eab308"; // Yellow
    if (score >= 40) return forText ? "text-orange-500" : "#f97316"; // Orange
    return forText ? "text-red-500" : "#ef4444"; // Red
  };

  // Colors for the pie chart
  const scoreColor = color || getScoreColor(validScore, false);
  const COLORS = [scoreColor, "#e5e7eb"];

  // Get label based on score
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PieChart width={120} height={120}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              fill="#8884d8"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
          <div
            className={`text-4xl font-bold ml-4 ${getScoreColor(validScore, true)}`}
          >
            {validScore}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-lg font-medium ${getScoreColor(validScore, true)}`}
          >
            {getScoreLabel(validScore)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {validScore < 60 ? lowScoreMessage : highScoreMessage}
          </p>
        </div>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        <p>{description}</p>
      </div>
    </Card>
  );
}
