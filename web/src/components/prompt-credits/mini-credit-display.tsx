"use client";

import { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { Coins, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  promptCreditsAtom,
  isLowCreditsAtom,
  isOutOfCreditsAtom,
} from "@/stores/promptCreditStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePromptCredits } from "@/hooks/usePromptCredits";

interface MiniCreditDisplayProps {
  className?: string;
}

export function MiniCreditDisplay({ className }: MiniCreditDisplayProps) {
  // Use both jotai atoms and Tanstack Query hook
  const [promptCredits] = useAtom(promptCreditsAtom);
  const [isLowCredits] = useAtom(isLowCreditsAtom);
  const [isOutOfCredits] = useAtom(isOutOfCreditsAtom);

  // Fetch credits using our Tanstack Query hook (will update promptCreditsAtom)
  const { isLoading: isLoadingCredits } = usePromptCredits();

  // Actual credit value from the store
  const actualCredits = promptCredits?.remainingCredits ?? 0;

  // State for the displayed value and animation control
  const [displayCredits, setDisplayCredits] = useState(actualCredits);
  const [isAnimating, setIsAnimating] = useState(false);

  // State to track if credits have loaded at least once
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(!!promptCredits);

  // Ref to store the target credits for the animation
  const targetCreditsRef = useRef(actualCredits);
  // Ref to track previous actual credits for change detection
  const prevCreditsRef = useRef(actualCredits);

  // Effect 1: Handle initial load and react to external credit changes from the atom
  useEffect(() => {
    const currentActualCredits = promptCredits?.remainingCredits ?? 0;
    const prevActualCredits = prevCreditsRef.current;

    if (promptCredits && !hasInitiallyLoaded) {
      // Initial load: Set displayCredits directly, no animation needed yet
      setDisplayCredits(currentActualCredits);
      targetCreditsRef.current = currentActualCredits;
      prevCreditsRef.current = currentActualCredits;
      setHasInitiallyLoaded(true);
    } else if (
      hasInitiallyLoaded &&
      currentActualCredits !== prevActualCredits
    ) {
      // Credits have changed, update the previous value ref
      prevCreditsRef.current = currentActualCredits;

      if (currentActualCredits > displayCredits) {
        // Credits Increased: Trigger animation
        targetCreditsRef.current = currentActualCredits;
        if (!isAnimating) {
          setIsAnimating(true);
        }
      } else if (currentActualCredits < displayCredits) {
        // Credits Decreased: Add delay then animate
        targetCreditsRef.current = currentActualCredits;

        // Use setTimeout to add a delay before starting the animation
        if (!isAnimating) {
          setTimeout(() => {
            setIsAnimating(true);
          }, 500); // 500ms delay before animation starts
        }
      }
    }
  }, [promptCredits, hasInitiallyLoaded, displayCredits, isAnimating]);

  // Effect 2: Run the animation interval when isAnimating is true
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isAnimating) {
      const target = targetCreditsRef.current;
      const isDecreasing = target < displayCredits;
      const diff = isDecreasing
        ? displayCredits - target
        : target - displayCredits;

      if (diff > 0) {
        // Calculate increment based on remaining difference and time
        // Use different timing for increases vs decreases
        const duration = isDecreasing
          ? Math.min(Math.max(diff * 500, 1500), 3000) // Even slower for decreases
          : Math.min(Math.max(diff * 100, 800), 2000);

        const stepTime = 60; // Larger step time means slower animation
        const steps = Math.max(1, duration / stepTime);

        // Smaller increment means more animation steps
        const increment = Math.max(0.1, Math.ceil(diff / (steps * 2)));

        timer = setInterval(() => {
          setDisplayCredits((prevDisplayCredits) => {
            if (isDecreasing) {
              // Decreasing credits animation
              const newDisplayCredits = prevDisplayCredits - increment;
              if (newDisplayCredits <= target) {
                clearInterval(timer!);
                setIsAnimating(false);
                return target;
              } else {
                return newDisplayCredits;
              }
            } else {
              // Increasing credits animation
              const newDisplayCredits = prevDisplayCredits + increment;
              if (newDisplayCredits >= target) {
                clearInterval(timer!);
                setIsAnimating(false);
                return target;
              } else {
                return newDisplayCredits;
              }
            }
          });
        }, stepTime);
      } else {
        // Target met or somehow exceeded at the start, stop animating
        setIsAnimating(false);
      }
    }

    // Cleanup function: Clear interval if component unmounts or dependencies change
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isAnimating, displayCredits]);

  if (isLoadingCredits || !hasInitiallyLoaded) {
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/30 ${className}`}
        data-testid="credit-balance"
      >
        <Coins className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium text-muted-foreground">...</span>
      </div>
    );
  }

  // Content to show based on credit status (zero credits shows "Buy Credits")
  const creditDisplay = isOutOfCredits ? (
    <>
      <ShoppingCart className="h-4 w-4 animate-pulse text-amber-500" />
      <span className="font-medium animate-pulse">Buy Credits</span>
    </>
  ) : (
    <div className="flex items-center gap-1">
      <Coins
        className={`h-4 w-4 transition-colors duration-300 ${
          isAnimating
            ? "text-amber-500 animate-pulse"
            : isLowCredits
              ? "text-amber-500"
              : "text-muted-foreground"
        }`}
      />
      <span className="font-medium">{Math.round(displayCredits)} PC</span>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/settings/prompt-credits/purchase">
          <motion.div
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer hover:ring-1 hover:ring-amber-400 hover:brightness-105 transition-all ${
              isOutOfCredits
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                : isAnimating
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ring-1 ring-amber-400"
                  : isLowCredits
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    : "bg-muted/50"
            } ${className}`}
            transition={{ duration: 0.3 }}
            data-testid="credit-balance"
          >
            <span data-testid="credit-display">{creditDisplay}</span>
          </motion.div>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p data-testid="credit-tooltip">
          {isOutOfCredits
            ? "You're out of credits! Click to purchase more."
            : isLowCredits
              ? "Low prompt credits! Click to purchase more."
              : `${displayCredits} prompt credits remaining. Click to buy more.`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default MiniCreditDisplay;
