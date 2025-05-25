"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { firebaseUsers } from "@/lib/firebase/client/FirebaseUsers";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { clientAuth } from "@/lib/firebase/client";

interface XpDisplayProps {
  className?: string;
}

export function XpDisplay({ className }: XpDisplayProps) {
  // Get the user reference using the FirebaseUsers class
  const userRef = clientAuth.currentUser ? firebaseUsers.getRefUser() : null;
  
  // Use React Firebase Hooks to get real-time data
  const [profile, loading, error] = useDocumentData(userRef);

  if (loading) {
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/30 ${className}`}
      >
        <Sparkles className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium text-muted-foreground">...</span>
      </div>
    );
  }

  if (error) {
    console.error("Error loading XP:", error);
  }

  if (profile) {
    const xp = profile.xp || 0;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 rounded-full hover:border-amber-400"
            data-testid="xp-display"
          >
            <Sparkles className="h-4 w-4 mr-0 fill-amber-500 stroke-0" />
            <span className="text-xs font-medium">{xp} XP</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <p data-testid="xp-tooltip">
            You currently have {xp} XP. You can use XP to unlock new features
            and capabilities. Earn XP by completing tasks, engaging with the
            community, and using the platform.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  // Fallback if no profile is available
  return null;
}

export default XpDisplay;
