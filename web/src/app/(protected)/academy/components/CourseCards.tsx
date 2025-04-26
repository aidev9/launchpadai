"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useCourses } from "@/hooks/useCourses";
import { Badge } from "@/components/ui/badge";
import { setSelectedCourseAtom } from "@/lib/store/course-store";

interface CourseCardsProps {
  heading?: string;
  _demoUrl?: string;
}

const CourseCards = ({
  heading = "Featured Courses",
  _demoUrl = "https://www.shadcnblocks.com",
}: CourseCardsProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const { courses, loading, error } = useCourses();
  const router = useRouter();
  const setSelectedCourse = useSetAtom(setSelectedCourseAtom);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  // Function to get badge color based on course level
  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-600 hover:bg-green-700";
      case "intermediate":
        return "bg-blue-600 hover:bg-blue-700";
      case "advanced":
        return "bg-purple-600 hover:bg-purple-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  // Handle course click
  const handleCourseClick = (course: {
    id: string;
    title: string;
    imageUrl: string;
    level: string;
    summary: string;
  }) => {
    // Validate the level value
    let validLevel: "beginner" | "intermediate" | "advanced" = "intermediate"; // default
    const normalizedLevel = course.level.toLowerCase();
    if (["beginner", "intermediate", "advanced"].includes(normalizedLevel)) {
      validLevel = normalizedLevel as "beginner" | "intermediate" | "advanced";
    }

    // Store the selected course in the global atom with required properties
    setSelectedCourse({
      ...course,
      level: validLevel, // Use the validated level
      url: "", // Add empty url if not provided
      tags: [], // Add empty tags array if not provided
    });
    // Navigate to the course detail page
    router.push("/academy/course");
  };

  return (
    <section className="pb-8">
      <div className="container">
        <div className="mb-2 flex flex-col justify-between md:mb-14 md:flex-row md:items-end lg:mb-16">
          <div>
            <h2 className="text-3xl font-semibold md:mb-4 md:text-3xl lg:mb-2">
              {heading}
            </h2>
          </div>
          <div className="mt-8 flex shrink-0 items-center justify-start gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        {loading ? (
          <div className="container text-center py-10">
            <div className="animate-pulse">Loading courses...</div>
          </div>
        ) : error ? (
          <div className="container text-center py-10 text-red-500">
            Error loading courses: {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="container text-center py-10">
            No courses available. Please check back later.
          </div>
        ) : (
          <Carousel
            setApi={setCarouselApi}
            opts={{
              breakpoints: {
                "(max-width: 768px)": {
                  dragFree: true,
                },
              },
            }}
            className="relative left-[-1rem]"
          >
            <CarouselContent className="-mr-4 ml-8 2xl:mr-[max(0rem,calc(50vw-700px-1rem))] 2xl:ml-[max(8rem,calc(50vw-700px+1rem))]">
              {courses.map((course) => (
                <CarouselItem key={course.id} className="pl-4 md:max-w-[352px]">
                  <div
                    onClick={() => handleCourseClick(course)}
                    className="group flex h-full flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex aspect-[3/2] overflow-clip rounded-xl">
                        <div className="flex-1">
                          <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              width={500}
                              height={300}
                              className="h-full w-full object-cover object-center"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge
                                className={getLevelBadgeColor(course.level)}
                              >
                                {course.level}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 line-clamp-3 pt-4 text-lg font-medium break-words md:mb-3 md:pt-4 md:text-xl lg:pt-4 lg:text-xl">
                      {course.title}
                    </div>
                    <div className="mb-8 line-clamp-2 text-sm text-muted-foreground md:mb-12 md:text-base lg:mb-9">
                      {course.summary}
                    </div>
                    <div className="flex items-center text-sm">
                      View course details{" "}
                      <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default CourseCards;
