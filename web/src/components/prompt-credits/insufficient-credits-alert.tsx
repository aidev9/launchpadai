"use client";

import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface InsufficientCreditsAlertProps {
  className?: string;
}

export const InsufficientCreditsAlert: React.FC<
  InsufficientCreditsAlertProps
> = ({ className = "" }) => {
  return (
    <Alert variant="destructive" className={className}>
      <div className="flex items-center gap-2 pb-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Insufficient Credits</AlertTitle>
      </div>
      <AlertDescription>
        You've run out of prompt credits. Please{" "}
        <Link className="font-bold underline" href={`/upgrade`}>
          upgrade your plan
        </Link>{" "}
        or{" "}
        <Link className="font-bold underline" href={`/prompt-credits/purchase`}>
          purchase prompt credits
        </Link>{" "}
        to continue using this feature.
      </AlertDescription>
    </Alert>
  );
};

export default InsufficientCreditsAlert;
