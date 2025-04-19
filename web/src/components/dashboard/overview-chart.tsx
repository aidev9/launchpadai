"use client";

import React from "react";

export function OverviewChart() {
  // Mock data for monthly sales
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Sample data points
  const data = [
    3000, 4500, 2000, 3000, 4800, 3500, 4800, 4200, 3800, 4200, 3800, 3200,
  ];

  // Finding the maximum value for scaling
  const maxValue = Math.max(...data);
  const chartHeight = 300;

  // Scaling function to convert data value to pixel height
  const scaleY = (value: number) =>
    Math.round((value / maxValue) * (chartHeight - 40));

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm font-medium">Overview</p>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">$45K</div>
          <div className="h-3 w-px bg-muted-foreground/30"></div>
          <div className="text-xs">$6,000</div>
        </div>
      </div>
      <div className="h-[300px] relative">
        <div className="flex items-end justify-between h-full">
          {months.map((month, index) => (
            <div
              key={month}
              className="flex flex-col items-center w-full flex-1"
            >
              <div
                className="w-full mx-1 rounded bg-primary"
                style={{ height: `${scaleY(data[index])}px` }}
              ></div>
              <div className="mt-2 text-xs text-muted-foreground">{month}</div>
            </div>
          ))}
        </div>

        {/* Y axis labels */}
        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
          <div>$6,000</div>
          <div>$4,500</div>
          <div>$3,000</div>
          <div>$1,500</div>
          <div>$0</div>
        </div>
      </div>
    </div>
  );
}
