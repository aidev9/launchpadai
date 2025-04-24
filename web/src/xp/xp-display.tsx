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

interface XpDisplayProps {
  className?: string;
}

export function XpDisplay({ className }: XpDisplayProps) {
  const { xp, isLoading, error, refreshXp } = useXp();
  const [displayXp, setDisplayXp] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Set initial XP value and refresh only once on mount
  useEffect(() => {
    // Set initial display value
    setDisplayXp(xp);

    // Only refresh data on initial mount - don't set up repeating calls
    const refreshData = async () => {
      try {
        setLocalLoading(true);
        // Only refresh if xp is 0, to prevent unnecessary refreshes
        if (xp === 0) {
          await refreshXp();
          console.log("Initial XP refresh completed");
        }
      } catch (err) {
        console.error("Error refreshing XP on mount:", err);
      } finally {
        setLocalLoading(false);
      }
    };

    // Only refresh on mount if needed
    refreshData();

    // Set a loading timeout to prevent eternal loading state
    const loadingTimeoutId = setTimeout(() => {
      if (localLoading) {
        setLocalLoading(false);
        console.warn(
          "Loading timeout triggered - forcing loading state to false"
        );
      }
    }, 5000); // 5 second timeout for loading

    return () => {
      clearTimeout(loadingTimeoutId);
    };
  }, [xp, refreshXp]);

  // Update display when XP changes
  useEffect(() => {
    if (xp > displayXp) {
      setIsAnimating(true);
      // Animate the XP value
      const diff = xp - displayXp;
      const duration = Math.min(Math.max(diff * 100, 500), 2000); // Between 500ms and 2000ms
      const increment = Math.ceil(diff / 20);
      let current = displayXp;

      const timer = setInterval(() => {
        current += increment;
        if (current >= xp) {
          current = xp;
          clearInterval(timer);
          setTimeout(() => setIsAnimating(false), 1000);
        }
        setDisplayXp(current);
      }, duration / 20);

      return () => clearInterval(timer);
    } else if (xp !== displayXp) {
      // Handle case where XP decreases or is set to a different value
      setDisplayXp(xp);
    }
  }, [xp, displayXp]);

  // Show loading state - but only briefly
  if ((isLoading || localLoading) && !error && displayXp === 0) {
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/30 ${className}`}
      >
        <Sparkles className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Handle offline/error state
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
              className={`h-4 w-4 ${
                isAnimating ? "text-yellow-500" : "text-muted-foreground"
              }`}
            />
            <motion.span
              key={displayXp}
              initial={isAnimating ? { y: -20, opacity: 0 } : {}}
              animate={{ y: 0, opacity: 1 }}
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
