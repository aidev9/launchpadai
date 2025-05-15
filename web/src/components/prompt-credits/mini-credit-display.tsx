"use client";

import { useAtom } from "jotai";
import { Coins, LucideCoins, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { promptCreditsQueryAtom } from "@/stores/promptCreditStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface MiniCreditDisplayProps {
  className?: string;
}

export function MiniCreditDisplay({ className }: MiniCreditDisplayProps) {
  // Fetch credits using the query atom (will update promptCreditsAtom)
  const [{ data, isLoading }] = useAtom(promptCreditsQueryAtom);
  const router = useRouter();

  if (isLoading) {
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

  if (data) {
    // Content to show based on credit status (zero credits shows "Buy Credits")
    const remainingCredits = data.remainingCredits || 0;
    const isOutOfCredits = remainingCredits <= 0;
    const isLowCredits = remainingCredits <= 50;
    const creditDisplay = isOutOfCredits ? (
      <>
        <ShoppingCart className="h-4 w-4 animate-pulse text-amber-500" />
        <span className="font-medium animate-pulse">Buy Credits</span>
      </>
    ) : (
      <span className="font-medium">
        {Math.round(remainingCredits || 0)} PC
      </span>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 rounded-full hover:border-amber-400"
            data-testid="credit-balance"
            onClick={() => router.push("/settings/prompt-credits/purchase")}
          >
            <LucideCoins className="h-4 w-4 mr-0 fill-amber-500 stroke-0" />
            <span className="text-xs font-medium">{creditDisplay}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <p data-testid="credit-tooltip">
            {isOutOfCredits
              ? "You're out of credits! Click to purchase more."
              : isLowCredits
                ? "Low prompt credits! Click to purchase more."
                : `${remainingCredits} prompt credits remaining. Click to buy more.`}
          </p>
        </TooltipContent>
      </Tooltip>

      // <Tooltip>
      //  <TooltipTrigger asChild>
      //     <Link href="/settings/prompt-credits/purchase">
      //       <motion.div
      //         className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm cursor-pointer hover:ring-1 hover:ring-amber-400 hover:brightness-105 transition-all ${
      //           isOutOfCredits
      //             ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      //             : isLowCredits
      //               ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      //               : "bg-muted/50"
      //         } ${className}`}
      //         transition={{ duration: 0.3 }}
      //         data-testid="credit-balance"
      //       >
      //         <span data-testid="credit-display">{creditDisplay}</span>
      //       </motion.div>
      //     </Link>
      //   </TooltipTrigger>
      //   <TooltipContent>
      //     <p data-testid="credit-tooltip">
      //       {isOutOfCredits
      //         ? "You're out of credits! Click to purchase more."
      //         : isLowCredits
      //           ? "Low prompt credits! Click to purchase more."
      //           : `${remainingCredits} prompt credits remaining. Click to buy more.`}
      //     </p>
      //   </TooltipContent>
      // </Tooltip>
    );
  }
}

export default MiniCreditDisplay;
