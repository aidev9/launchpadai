"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function TopCourses() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const courses = [
    {
      name: "AI Fundamentals",
      enrollments: 3245,
      maxEnrollments: 5000,
      category: "AI Basics",
      trend: "up",
    },
    {
      name: "Machine Learning Essentials",
      enrollments: 2876,
      maxEnrollments: 5000,
      category: "ML",
      trend: "up",
    },
    {
      name: "Python for Data Science",
      enrollments: 2354,
      maxEnrollments: 5000,
      category: "Data Science",
      trend: "stable",
    },
    {
      name: "Deep Learning Mastery",
      enrollments: 1987,
      maxEnrollments: 5000,
      category: "ML",
      trend: "up",
    },
    {
      name: "NLP Fundamentals",
      enrollments: 1756,
      maxEnrollments: 5000,
      category: "NLP",
      trend: "down",
    },
  ];

  if (!isMounted) {
    return (
      <div className="h-[240px] w-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium truncate" title={course.name}>
              {course.name}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {course.category}
              </Badge>
              {course.trend === "up" ? (
                <span className="text-xs text-green-500">↑</span>
              ) : course.trend === "down" ? (
                <span className="text-xs text-red-500">↓</span>
              ) : (
                <span className="text-xs text-gray-500">→</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              className="h-2"
              value={(course.enrollments / course.maxEnrollments) * 100}
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {course.enrollments.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
