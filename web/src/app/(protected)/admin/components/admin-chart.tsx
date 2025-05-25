"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Define Chart.js compatible chart data type
export type ChartDataset = {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
  borderWidth?: number;
  tension?: number;
};

export type ChartDataType = {
  labels: string[];
  datasets: ChartDataset[];
};

// Import Chart.js types but load the actual library only on the client
import type { ChartType, ChartOptions } from "chart.js";

interface AdminChartProps {
  title: string;
  description?: string;
  chartData: ChartDataType;
  type: "line" | "bar" | "pie" | "doughnut";
  height?: number;
  isLoading?: boolean;
}

export function AdminChart({
  title,
  description,
  chartData,
  type,
  height = 300,
  isLoading = false,
}: AdminChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Generate a unique ID for this chart instance
    const chartId = `chart-${Math.random().toString(36).substring(2, 9)}`;

    if (isLoading || !chartRef.current) return;

    // Set a unique ID on the canvas to avoid conflicts
    chartRef.current.id = chartId;

    // Dynamically import Chart.js only on the client side
    const initChart = async () => {
      // Always destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }

      // Get a fresh context
      const ctx = chartRef.current?.getContext("2d");
      if (!ctx) return;

      try {
        // Import Chart.js dynamically
        const { Chart } = await import("chart.js/auto");

        // Create new chart instance
        chartInstance.current = new Chart(ctx, {
          type: type as ChartType,
          data: chartData as any,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                mode: "index",
                intersect: false,
              },
            },
            scales:
              type === "line" || type === "bar"
                ? {
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        drawBorder: false,
                      },
                    },
                  }
                : undefined,
          } as ChartOptions,
        });
      } catch (error) {
        console.error("Error initializing chart:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initChart();
    }, 50);

    // Cleanup on unmount or when dependencies change
    return () => {
      clearTimeout(timer);
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartData, type, isLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        ) : (
          <div style={{ height: `${height}px` }}>
            <canvas ref={chartRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
