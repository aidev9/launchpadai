"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Milestone } from "./components/milestone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Calendar } from "lucide-react";
import { Step, StepStatus } from "@/app/(protected)/milestones/types";
import { clientDb } from "@/lib/firebase/client";
import { doc, getDoc, Firestore } from "firebase/firestore";
import { useAtom } from "jotai";
import { getCurrentUserProfileAtom } from "@/lib/store/user-store";
import { userProfileAtom, updateUserProfileAtom } from "@/lib/store/user-store";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Custom hook to fetch product timeline from Firestore
function useProductTimeline(productId: string | null) {
  const [timeline, setTimeline] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userProfile] = useAtom(userProfileAtom);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!productId || !getCurrentUserId() || !clientDb) {
        setTimeline(null);
        return;
      }
      setLoading(true);
      try {
        const db = clientDb as Firestore;
        const userId = await getCurrentUserId();
        const questionsDocRef = doc(
          db,
          "questions",
          userId,
          "products",
          productId
        );
        const questionsSnapshot = await getDoc(questionsDocRef);
        if (questionsSnapshot.exists()) {
          const questions = questionsSnapshot.data();
          if (!questions) {
            setTimeline(null);
            setLoading(false);
            return;
          }
          const timelineQuestion = Object.values(questions).find(
            (q: { question?: string }) =>
              q?.question?.toLowerCase?.().includes("timeline")
          );
          setTimeline(timelineQuestion?.answer || null);
        } else {
          setTimeline(null);
        }
      } catch (error) {
        console.error("Error fetching product timeline:", error);
        setTimeline(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
    // Only re-run if productId or userProfile changes
  }, [productId, userProfile]);

  return { timeline, loading };
}

export default function MilestonesPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const [isLocked, setIsLocked] = useState(true);
  const [userProfile] = useAtom(getCurrentUserProfileAtom);

  // Use custom hook instead of React Query
  const { timeline } = useProductTimeline(productId);

  useEffect(() => {
    if (timeline) {
      setIsLocked(false);
    } else if (userProfile?.hasAnsweredTimelineQuestion) {
      setIsLocked(false);
    }
  }, [timeline, userProfile]);

  const milestoneSteps: Step[] = [
    {
      id: 1,
      title: "Ideation Phase",
      description: "Brainstorming and refining your core product idea",
      duration: "1-2 weeks",
      status: StepStatus.Completed,
    },
    {
      id: 2,
      title: "Market Research",
      description: "Analyzing competitors and validating market need",
      duration: "2-4 weeks",
      status: StepStatus.Current,
    },
    {
      id: 3,
      title: "Prototype Development",
      description: "Building a basic version to test core functionality",
      duration: "4-8 weeks",
      status: StepStatus.Upcoming,
    },
    {
      id: 4,
      title: "User Testing",
      description: "Getting feedback from early adopters",
      duration: "2-3 weeks",
      status: StepStatus.Upcoming,
    },
    {
      id: 5,
      title: "MVP Launch",
      description: "Releasing the minimal viable product",
      duration: "1 week",
      status: StepStatus.Upcoming,
    },
    {
      id: 6,
      title: "Growth & Optimization",
      description: "Acquiring users and iterating based on feedback",
      duration: "Ongoing",
      status: StepStatus.Upcoming,
    },
    {
      id: 7,
      title: "Scaling",
      description: "Expanding features and user base",
      duration: "3-6 months+",
      status: StepStatus.Upcoming,
    },
  ];

  // Adjust duration based on timeline if available
  useEffect(() => {
    if (timeline) {
      // let timelineModifier = 1; // Default multiplier

      if (
        timeline.toLowerCase().includes("quick") ||
        timeline.toLowerCase().includes("fast")
      ) {
        // timelineModifier = 0.7; // Faster timeline
      } else if (
        timeline.toLowerCase().includes("slow") ||
        timeline.toLowerCase().includes("long")
      ) {
        // timelineModifier = 1.5; // Slower timeline
      }

      // Could update the milestones here based on the modifier
    }
  }, [timeline]);

  if (isLocked) {
    return (
      <div className="container mx-auto py-12 px-2">
        <Card className="max-w-3xl mx-auto shadow-lg border-2 border-yellow-300">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-600" />
              <span>Milestones Feature Locked</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="mb-6 text-lg">
              Answer the timeline question in your product details to unlock the
              Milestones feature and earn 5 XP!
            </p>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
              Go to Product Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Startup Milestones</h1>
          <p className="text-muted-foreground">
            A visual roadmap of your startup journey
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Unlock className="h-3.5 w-3.5" />
          <span>Premium Feature Unlocked</span>
        </Badge>
      </div>

      {timeline && (
        <Card className="mb-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Your Timeline:</p>
              <p className="text-muted-foreground">{timeline}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative mt-12 pb-12">
        {/* Timeline line */}
        <div className="absolute top-0 bottom-0 left-[50%] w-1 bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2 z-0"></div>

        {/* Milestones */}
        <div className="relative z-10">
          {milestoneSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Milestone step={step} alignLeft={index % 2 === 0} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
