"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { courseActionAtom, initialLoadAtom } from "@/lib/store/course-store";

export function SeedCoursesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setCourseAction] = useAtom(courseActionAtom);
  const [, setInitialLoad] = useAtom(initialLoadAtom);
  const { toast } = useToast();

  const handleSeedCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/courses/seed", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to seed courses");
      }

      toast({
        title: "Success",
        description: data.message || "Sample courses have been added",
      });

      // For bulk operations like seeding, simply trigger a full reload
      // This is more efficient than adding multiple individual courses
      setInitialLoad((prev) => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSeedCourses} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding samples...
        </>
      ) : (
        "Add Sample Courses"
      )}
    </Button>
  );
}
