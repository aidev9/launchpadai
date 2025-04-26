"use client";

import { useEffect, useState } from "react";

// Define interface for retention data row
interface RetentionRow {
  cohort: string;
  users: number;
  [key: `month${number}`]: number;
}

// Generate retention data for cohorts (users who joined in a specific month)
// showing what percentage remained active in subsequent months
const generateRetentionData = (): RetentionRow[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const data: RetentionRow[] = [];

  for (let i = 0; i < months.length; i++) {
    const row: RetentionRow = {
      cohort: months[i],
      users: Math.floor(Math.random() * 1000) + 500,
    };

    // For each month after joining, calculate retention percentage
    for (let j = 0; j <= i; j++) {
      // Start with 100% and gradually decrease retention over time
      // with some random variation to make it realistic
      const initialRetention = 100;
      const decay = Math.pow(0.85, j); // Exponential decay
      const randomVariation = Math.random() * 10 - 5; // +/- 5%

      let retention = Math.round(initialRetention * decay + randomVariation);
      // Add a floor to prevent negative numbers
      retention = Math.max(retention, j === 0 ? 100 : 25);
      // Ensure 100% for the month they joined
      retention = j === 0 ? 100 : retention;

      row[`month${j + 1}`] = retention;
    }

    data.push(row);
  }

  return data;
};

export function RetentionHeatmapChart() {
  const [isMounted, setIsMounted] = useState(false);
  const [retentionData, setRetentionData] = useState<RetentionRow[]>([]);

  useEffect(() => {
    setIsMounted(true);
    setRetentionData(generateRetentionData());
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  // Color scale for the heatmap
  const getColorForValue = (value: number): string => {
    // Color gradient from red (low retention) to green (high retention)
    if (value >= 90) return "bg-green-600 text-white";
    if (value >= 80) return "bg-green-500 text-white";
    if (value >= 70) return "bg-green-400 text-white";
    if (value >= 60) return "bg-yellow-400 text-white";
    if (value >= 50) return "bg-yellow-500 text-white";
    if (value >= 40) return "bg-orange-400 text-white";
    if (value >= 30) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border px-3 py-2 bg-card text-left">Cohort</th>
            <th className="border px-3 py-2 bg-card text-center">Users</th>
            {[1, 2, 3, 4, 5, 6].map((month) => (
              <th key={month} className="border px-3 py-2 bg-card text-center">
                Month {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {retentionData.map((row) => (
            <tr key={row.cohort}>
              <td className="border px-3 py-2 font-medium">
                {row.cohort} 2025
              </td>
              <td className="border px-3 py-2 text-center">{row.users}</td>
              {[1, 2, 3, 4, 5, 6].map((month) => {
                const value = row[`month${month}`];
                return value !== undefined ? (
                  <td
                    key={month}
                    className={`border px-3 py-2 text-center ${getColorForValue(value)}`}
                  >
                    {value}%
                  </td>
                ) : (
                  <td
                    key={month}
                    className="border px-3 py-2 bg-gray-100 dark:bg-gray-800"
                  ></td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
