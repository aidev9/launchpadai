"use client";

import { Sparkles } from "lucide-react";
import { useAtom } from "jotai";
import { userProfileQueryAtom } from "@/lib/store/user-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface XpDisplayProps {
  className?: string;
}

export function XpDisplay({ className }: XpDisplayProps) {
  const [{ data, isLoading }] = useAtom(userProfileQueryAtom);

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-muted/30 ${className}`}
      >
        <Sparkles className="h-4 w-4 text-muted-foreground animate-pulse" />
        <span className="font-medium text-muted-foreground">...</span>
      </div>
    );
  }

  if (data) {
    const xp = data.xp || 0;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 rounded-full hover:border-amber-400"
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
}

export default XpDisplay;
