"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";

export default function SeedCoursesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleSeedCourses = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      const response = await fetch("/api/courses/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error seeding courses:", error);
      setResult({
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        onClick={handleSeedCourses}
        disabled={isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Seeding Courses...</span>
          </>
        ) : (
          <>
            <Database className="size-4" />
            <span>Seed Course Database</span>
          </>
        )}
      </Button>

      {result && (
        <div
          className={`text-sm px-4 py-2 rounded-md ${result.success ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}
        >
          {result.success
            ? result.message || "Courses added successfully!"
            : `Error: ${result.error || "Failed to add courses"}`}
        </div>
      )}
    </div>
  );
}
