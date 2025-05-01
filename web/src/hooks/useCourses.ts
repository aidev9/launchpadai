"use client";

import { useState, useEffect } from "react";
import { Course } from "@/lib/firebase/schema";

// Define the response type from our API endpoint
interface CoursesResponse {
  success: boolean;
  courses?: Course[];
  error?: string;
}

/**
 * Custom hook to fetch courses from the API
 */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);

        // Call the API endpoint to fetch courses
        const response = await fetch("/api/courses");

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const data: CoursesResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch courses");
        }

        setCourses(data.courses || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  return { courses, loading, error };
}
