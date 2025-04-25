"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { useXp } from "./useXp";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";

interface XpDisplayProps {
  className?: string;
}

export function XpDisplay({ className }: XpDisplayProps) {
  const { xp, isLoading, error, refreshXp } = useXp();
  const [userProfile] = useAtom(userProfileAtom);
  const userId = userProfile?.uid;
  const [displayXp, setDisplayXp] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    setDisplayXp(xp);
  }, [xp]);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeoutId: NodeJS.Timeout | null = null;

    const refreshData = async () => {
      if (!userId) {
        setLocalLoading(false);
        return;
      }

      console.log("User ID available, attempting XP refresh...");
      setLocalLoading(true);

      loadingTimeoutId = setTimeout(() => {
        if (isMounted && localLoading) {
          setLocalLoading(false);
          console.warn(
            "Loading timeout triggered - forcing loading state to false"
          );
        }
      }, 8000);

      try {
        await refreshXp();
        if (isMounted) {
          console.log("XP refresh completed via userId effect");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error refreshing XP via userId effect:", err);
        }
      } finally {
        if (isMounted) {
          setLocalLoading(false);
          if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
          }
        }
      }
    };

    refreshData();

    return () => {
      isMounted = false;
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
    };
  }, [userId, refreshXp]);

  useEffect(() => {
    if (xp !== displayXp) {
      console.log(`XP changed: displayXp=${displayXp}, new hook xp=${xp}`);
      if (xp > displayXp) {
        setIsAnimating(true);
        const diff = xp - displayXp;
        const duration = Math.min(Math.max(diff * 50, 500), 2000);
        const stepTime = 25;
        const steps = duration / stepTime;
        const increment = Math.max(1, Math.ceil(diff / steps));
        let current = displayXp;
        console.log(
          `Animating XP: diff=${diff}, duration=${duration}, increment=${increment}`
        );

        const timer = setInterval(() => {
          current += increment;
          if (current >= xp) {
            current = xp;
            clearInterval(timer);
            console.log("Animation finished");
            setTimeout(() => setIsAnimating(false), 500);
          }
          setDisplayXp(current);
        }, stepTime);

        return () => clearInterval(timer);
      } else {
        console.log(
          "XP decreased or changed non-sequentially, updating directly."
        );
        setDisplayXp(xp);
        setIsAnimating(false);
      }
    }
  }, [xp]);

  if ((isLoading || localLoading) && displayXp === 0 && !error) {
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/30 ${className}`}
      >
        <Sparkles className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const isOffline = error?.includes("offline");

  return (
    <AnimatePresence>
      <motion.div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
          isAnimating
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            : error
              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200"
              : "bg-muted/50"
        } ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          borderColor: isAnimating
            ? ["#fbbf24", "#f59e0b", "#fbbf24"]
            : error
              ? "#f97316"
              : "#e5e7eb",
        }}
        transition={{
          duration: 0.3,
          borderColor: { repeat: isAnimating ? 3 : 0, duration: 1 },
        }}
      >
        {error ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  {isOffline ? (
                    <WifiOff className="h-4 w-4 text-orange-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <motion.span key={displayXp} className="font-medium">
                    {displayXp} XP
                  </motion.span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <Sparkles
              className={`h-4 w-4 transition-colors duration-300 ${
                isAnimating
                  ? "text-yellow-500 animate-pulse"
                  : "text-muted-foreground"
              }`}
            />
            <motion.span
              key={displayXp}
              initial={isAnimating ? { y: -10, opacity: 0.5 } : {}}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="font-medium"
            >
              {displayXp} XP
            </motion.span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default XpDisplay;
