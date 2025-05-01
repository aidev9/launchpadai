"use client";

import { Course } from "@/lib/firebase/schema";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Book, Tag, Users } from "lucide-react";
import { useSetAtom } from "jotai";
import { selectedCourseAtom } from "./courses-store";
import { useRouter } from "next/navigation";
import { PLACEHOLDER_IMAGE_URL } from "@/utils/constants";

interface CourseHoverCardProps {
  course: Course;
}

export function CourseHoverCard({ course }: CourseHoverCardProps) {
  const router = useRouter();
  const setSelectedCourse = useSetAtom(selectedCourseAtom);

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from also triggering
    setSelectedCourse(course);
    router.push(`/admin/courses/course`);
  };

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <span
          className="font-medium cursor-pointer hover:underline max-w-[300px] truncate block text-primary"
          onClick={handleCourseClick}
        >
          {course.title}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0">
        <div className="relative h-40 w-full">
          <Image
            src={course.imageUrl || PLACEHOLDER_IMAGE_URL}
            alt={course.title}
            fill
            className="object-cover rounded-t-md"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge
            className="absolute top-2 right-2 capitalize"
            variant={
              course.level === "beginner"
                ? "default"
                : course.level === "intermediate"
                  ? "secondary"
                  : "outline"
            }
          >
            {course.level}
          </Badge>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold">{course.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {course.summary}
          </p>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {/* You can add another property here if needed, or remove this block entirely */}

            {course.tags && course.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>{course.tags.length} tags</span>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
