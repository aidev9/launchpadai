"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/lib/store/user-store";

interface XpDisplayProps {
  className?: string;
}

export function XpDisplay({ className }: XpDisplayProps) {
  const [userProfile] = useAtom(userProfileAtom);
  const actualXp = userProfile?.xp ?? 0;

  // State for the displayed value and animation control
  const [displayXp, setDisplayXp] = useState(actualXp);
  const [isAnimating, setIsAnimating] = useState(false);

  // State to track if the profile has loaded at least once
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(!!userProfile);

  // Ref to store the target XP for the animation
  const targetXpRef = useRef(actualXp);

  // Effect 1: Handle initial load and react to external XP changes from the atom
  useEffect(() => {
    const currentActualXp = userProfile?.xp ?? 0;

    if (userProfile && !hasInitiallyLoaded) {
      // Initial load: Set displayXp directly, no animation needed yet

      setDisplayXp(currentActualXp);
      targetXpRef.current = currentActualXp;
      setHasInitiallyLoaded(true);
    } else if (hasInitiallyLoaded) {
      // Profile has loaded, now react to changes
      if (currentActualXp > displayXp) {
        // XP Increased: Trigger animation

        targetXpRef.current = currentActualXp; // Update target
        if (!isAnimating) {
          setIsAnimating(true); // Start animation if not already running
        }
      } else if (currentActualXp < displayXp) {
        // XP Decreased (or reset): Snap to new value, stop animation

        setIsAnimating(false);
        setDisplayXp(currentActualXp);
        targetXpRef.current = currentActualXp;
      } else {
        // XP is the same as displayXp. If we were animating towards this value,
        // the animation interval (Effect 2) will handle stopping the animation.
        // If the target was different, update it.
        if (targetXpRef.current !== currentActualXp) {
          targetXpRef.current = currentActualXp;
        }
      }
    }
    // React only to userProfile changes (and initial load status)
    // displayXp is intentionally omitted to compare against the state *before* this effect runs
  }, [userProfile, hasInitiallyLoaded, displayXp, isAnimating]);

  // Effect 2: Run the animation interval when isAnimating is true
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isAnimating) {
      const target = targetXpRef.current;
      const diff = target - displayXp;
      // console.log(`Animation Running: Current=${displayXp}, Target=${target}, Diff=${diff}`);

      if (diff > 0) {
        // Calculate increment based on remaining difference and time
        const duration = Math.min(Math.max(diff * 40, 400), 1500); // Adjust timing slightly
        const stepTime = 30;
        const steps = Math.max(1, duration / stepTime);
        const increment = Math.max(1, Math.ceil(diff / steps));

        timer = setInterval(() => {
          setDisplayXp((prevDisplayXp) => {
            const newDisplayXp = prevDisplayXp + increment;
            if (newDisplayXp >= target) {
              // Reached or passed target
              clearInterval(timer!); // Stop interval first
              setIsAnimating(false); // Stop animation state
              // console.log(`Animation reached target: ${target}`);
              return target; // Ensure display snaps exactly to target
            } else {
              return newDisplayXp;
            }
          });
        }, stepTime);
      } else {
        // Target met or somehow exceeded at the start, stop animating
        // console.log("Animation target already met or exceeded, stopping.");
        setIsAnimating(false);
      }
    }

    // Cleanup function: Clear interval if component unmounts or dependencies change
    return () => {
      if (timer) {
        clearInterval(timer);
        // console.log("Animation interval cleared.");
      }
    };
    // Rerun this effect if animation starts/stops or the target changes mid-animation
    // displayXp is added to dependencies to correctly calculate 'diff' if it changes externally
  }, [isAnimating, displayXp, targetXpRef]);

  // Remove the third useEffect (snapping logic is integrated into Effect 1)
  /*
  useEffect(() => {
    const actualXp = userProfile?.xp ?? 0;
    if (!isAnimating && displayXp !== actualXp && hasInitiallyLoaded) {
      console.log(
        `Snapping displayXp: ${displayXp} -> ${actualXp} (Not animating)`
      );
      setDisplayXp(actualXp);
      // setTargetXp(actualXp); // Removed targetXp state
    }
  }, [userProfile, isAnimating, displayXp, hasInitiallyLoaded]);
  */

  if (!hasInitiallyLoaded) {
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/30 ${className}`}
      >
        <Sparkles className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
        isAnimating
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ring-1 ring-yellow-400"
          : "bg-muted/50"
      } ${className}`}
      transition={{ duration: 0.3 }}
    >
      <>
        <Sparkles
          className={`h-4 w-4 transition-colors duration-300 ${
            isAnimating
              ? "text-yellow-500 animate-pulse"
              : "text-muted-foreground"
          }`}
        />
        <span className="font-medium">{displayXp} XP</span>
      </>
    </motion.div>
  );
}

export default XpDisplay;
