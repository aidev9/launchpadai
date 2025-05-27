import React from "react";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Loader2,
  RotateCcwIcon,
  Save,
} from "lucide-react";

type WizardFooterProps = {
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  onReset?: () => void;
  onSaveAndFinishLater?: () => void;
  isBackDisabled?: boolean;
  isNextDisabled?: boolean;
  isSkipDisabled?: boolean;
  nextButtonText?: string;
  showSkip?: boolean;
};

export default function WizardFooter({
  onBack,
  onNext,
  onSkip,
  onReset,
  onSaveAndFinishLater,
  isBackDisabled = false,
  isNextDisabled = false,
  isSkipDisabled = false,
  nextButtonText = "Next",
  showSkip = false,
}: WizardFooterProps) {
  return (
    <CardFooter className="px-4 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isBackDisabled}
          className="flex items-center gap-1 h-8 text-sm"
          size="sm"
        >
          <ArrowLeftIcon className="h-3 w-3" />
          Back
        </Button>
        {onReset && (
          <Button
            variant="outline"
            onClick={onReset}
            className="flex items-center gap-1 h-8 text-sm"
            size="sm"
            title="Reset Wizard"
          >
            <RotateCcwIcon className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isSkipDisabled}
            className="flex items-center gap-1 h-8 text-sm"
            size="sm"
          >
            Skip Step
          </Button>
        )}
        {onSaveAndFinishLater && (
          <Button
            variant="outline"
            onClick={onSaveAndFinishLater}
            className="flex items-center gap-1 h-8 text-sm"
            size="sm"
            title="Save & Finish Later"
          >
            <Save className="h-3 w-3" />
            Save & Finish Later
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="flex items-center gap-1 h-8 text-sm"
          size="sm"
        >
          {nextButtonText?.includes("Uploading") ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              {nextButtonText}
            </>
          ) : (
            <>
              {nextButtonText}
              <ArrowRightIcon className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </CardFooter>
  );
}
