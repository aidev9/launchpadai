"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import {
  BookOpen,
  Clock,
  Star,
  Award,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  PlayCircle,
  FileText,
  Cog,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/breadcrumbs";

import { selectedCourseAtom } from "@/lib/store/course-store";

// Mock course modules data
const courseModules = [
  {
    id: 1,
    title: "Introduction to the Course",
    duration: "15 min",
    completed: true,
    type: "video",
  },
  {
    id: 2,
    title: "Key Concepts and Terminology",
    duration: "25 min",
    completed: true,
    type: "video",
  },
  {
    id: 3,
    title: "Module 1 Exercise",
    duration: "20 min",
    completed: false,
    type: "exercise",
  },
  {
    id: 4,
    title: "Advanced Techniques",
    duration: "35 min",
    completed: false,
    type: "video",
  },
  {
    id: 5,
    title: "Practical Applications",
    duration: "40 min",
    completed: false,
    type: "video",
  },
  {
    id: 6,
    title: "Final Project",
    duration: "60 min",
    completed: false,
    type: "exercise",
  },
];

// Mock reviews
const courseReviews = [
  {
    id: 1,
    user: "Alex Johnson",
    rating: 5,
    comment:
      "Excellent course! The content was well-structured and easy to follow. I feel much more confident in my skills now.",
    date: "2025-04-15",
  },
  {
    id: 2,
    user: "Sam Thompson",
    rating: 4,
    comment:
      "Very informative course with practical examples. Could use more exercises, but overall great value.",
    date: "2025-04-10",
  },
  {
    id: 3,
    user: "Jordan Lee",
    rating: 5,
    comment:
      "The instructor explains complex concepts in a way that's easy to understand. Highly recommended!",
    date: "2025-04-05",
  },
];

// Mock tools
const courseTools = [
  {
    id: 1,
    name: "Course Slides",
    description: "Download the complete slide deck for offline reference",
    icon: Download,
  },
  {
    id: 2,
    name: "Code Repository",
    description: "Access example code and exercises on GitHub",
    icon: Cog,
  },
  {
    id: 3,
    name: "Discussion Forum",
    description: "Connect with other students and ask questions",
    icon: MessageSquare,
  },
];

export default function CourseDetailPage() {
  const [selectedCourse] = useAtom(selectedCourseAtom);
  const [progress, setProgress] = useState(33);
  const router = useRouter();

  useEffect(() => {
    // If no course is selected, redirect back to the academy page
    if (!selectedCourse) {
      router.push("/academy");
    }
  }, [selectedCourse, router]);

  // Calculate completed modules
  const completedModules = courseModules.filter(
    (module) => module.completed
  ).length;
  const totalModules = courseModules.length;

  // Calculate average rating
  const averageRating =
    courseReviews.reduce((sum, review) => sum + review.rating, 0) /
    courseReviews.length;

  if (!selectedCourse) {
    return (
      <div className="container py-10 text-center">
        <div className="animate-pulse">Loading course details...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Add breadcrumbs */}
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumbs
          items={[
            { label: "Academy", href: "/academy" },
            { label: selectedCourse.title, href: "", isCurrentPage: true },
          ]}
        />
      </div>

      {/* Hero Section with Course Image Background */}
      <div
        className="relative w-full h-[240px] bg-cover bg-center flex items-center mt-4"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${selectedCourse.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 pt-5 pb-8 z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className={getBadgeColor(selectedCourse.level)}>
              {selectedCourse.level.charAt(0).toUpperCase() +
                selectedCourse.level.slice(1)}
            </Badge>
            {selectedCourse.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {selectedCourse.title}
          </h1>

          <div className="flex items-center gap-6 text-white mt-2">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>6 hours</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              <span>{totalModules} modules</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400 fill-yellow-400" />
              <span>
                {averageRating.toFixed(1)} ({courseReviews.length} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <h2 className="text-2xl font-semibold mb-4">
                  About This Course
                </h2>
                <p className="mb-6 text-muted-foreground">
                  {selectedCourse.description || selectedCourse.summary}
                </p>

                <h3 className="text-xl font-semibold mb-3">
                  What You'll Learn
                </h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Understand core concepts and principles</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Apply techniques to real-world scenarios</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Build practical projects from scratch</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Master advanced methodologies</span>
                  </li>
                </ul>
              </TabsContent>

              <TabsContent value="modules">
                <h2 className="text-2xl font-semibold mb-4">Course Modules</h2>
                <div className="space-y-4">
                  {courseModules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      {module.completed ? (
                        <CheckCircle2 className="h-5 w-5 mr-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <CircleDashed className="h-5 w-5 mr-4 text-muted-foreground flex-shrink-0" />
                      )}

                      {module.type === "video" ? (
                        <PlayCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                      ) : (
                        <FileText className="h-5 w-5 mr-3 flex-shrink-0" />
                      )}

                      <div className="flex-1">
                        <div className="font-medium">{module.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {module.duration}
                        </div>
                      </div>

                      <Button size="sm">
                        {module.completed ? "Revisit" : "Start"}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Student Reviews</h2>
                  <Button>Write a Review</Button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-3xl font-bold">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({courseReviews.length} reviews)
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {courseReviews.map((review) => (
                    <div key={review.id} className="border-b pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{review.user}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="resources">
                <h2 className="text-2xl font-semibold mb-6">
                  Course Resources
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {courseTools.map((tool) => (
                    <Card key={tool.id}>
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <tool.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle>{tool.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{tool.description}</CardDescription>
                        <Button className="mt-4" variant="outline">
                          Access Resource
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                <CardDescription>
                  Complete all modules to earn your certificate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between text-sm mb-4">
                  <div>
                    <span className="block font-medium">
                      {completedModules} / {totalModules}
                    </span>
                    <span className="text-muted-foreground">
                      Modules Completed
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-medium">2 hours</span>
                    <span className="text-muted-foreground">Time Spent</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <Button className="w-full">Continue Learning</Button>
                  <Button variant="outline" className="w-full">
                    <Award className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Discussion Forum</CardTitle>
                <CardDescription>Connect with other students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                      <span className="text-xs font-medium">AJ</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Alex Johnson</div>
                      <div className="text-sm text-muted-foreground">
                        How do I implement the final exercise?
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        2 hours ago • 3 replies
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                      <span className="text-xs font-medium">ST</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Sam Thompson</div>
                      <div className="text-sm text-muted-foreground">
                        Great explanation in module 2!
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        1 day ago • 1 reply
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View All Discussions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get badge color based on course level
function getBadgeColor(level: string) {
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
}
