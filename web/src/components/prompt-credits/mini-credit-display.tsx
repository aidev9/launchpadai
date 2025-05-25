"use client";

import { Coins, LucideCoins, ShoppingCart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { firebasePromptCredits } from "@/lib/firebase/client/FirebasePromptCredits";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { clientAuth } from "@/lib/firebase/client";

interface MiniCreditDisplayProps {
  className?: string;
}

export function MiniCreditDisplay({ className }: MiniCreditDisplayProps) {
  const router = useRouter();
  
  // Get the prompt credits reference using the FirebasePromptCredits class
  const creditsRef = clientAuth.currentUser ? firebasePromptCredits.getPromptCreditsRef() : null;
  
  // Use React Firebase Hooks to get real-time data
  const [credits, loading, error] = useDocumentData(creditsRef);

  if (loading) {
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
  
  if (error) {
    console.error("Error loading prompt credits:", error);
  }

  if (credits) {
    // Content to show based on credit status (zero credits shows "Buy Credits")
    const remainingCredits = credits.remainingCredits || 0;
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


    );
  }
}

export default MiniCreditDisplay;
