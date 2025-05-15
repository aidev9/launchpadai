"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { selectedFeatureAtom } from "@/lib/store/feature-store";
import { updateFeature } from "@/lib/firebase/features";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePrd, enhancePrd } from "@/lib/ai/feature-prd";
import { useAtom as useJotaiAtom } from "jotai";
import { promptCreditsAtom } from "@/stores/promptCreditStore";
import { fetchPromptCredits } from "@/lib/firebase/actions/promptCreditActions";

export function AiPlayground() {
  const [feature, setFeature] = useAtom(selectedFeatureAtom);
  const [currentPrd, setCurrentPrd] = useState("");
  const [enhancedPrd, setEnhancedPrd] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [promptCredits, setPromptCredits] = useJotaiAtom(promptCreditsAtom);
  const { toast } = useToast();

  // Generate initial PRD when component mounts
  useEffect(() => {
    const generateInitialPrd = async () => {
      if (!feature) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Use stored PRD content if available, otherwise generate a new one
        if (feature.prdContent) {
          setCurrentPrd(feature.prdContent);
        } else {
          // Optimistically update credit count for initial generation
          if (promptCredits) {
            setPromptCredits({
              ...promptCredits,
              remainingCredits: Math.max(0, promptCredits.remainingCredits - 1),
            });
          }

          const result = await generatePrd(feature);

          if (result.success && result.prdContent) {
            setCurrentPrd(result.prdContent);
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to generate PRD",
              variant: "destructive",
            });
          }

          // Fetch updated credit count
          const creditsResponse = await fetchPromptCredits();
          if (creditsResponse.success && creditsResponse.credits) {
            setPromptCredits(creditsResponse.credits);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateInitialPrd();
  }, [feature, toast, promptCredits, setPromptCredits]);

  // Handle enhancing the PRD
  const handleEnhancePrd = async () => {
    if (!feature || !currentPrd) return;

    setIsEnhancing(true);

    // Optimistically update credit count
    if (promptCredits) {
      setPromptCredits({
        ...promptCredits,
        remainingCredits: Math.max(0, promptCredits.remainingCredits - 1),
      });
    }

    try {
      // Create form data for the server action
      const formData = new FormData();
      formData.append("featureId", feature.id || "");
      formData.append("productId", feature.productId);
      formData.append("currentPrd", currentPrd);
      formData.append("instructions", instructions);

      // Call the enhance PRD server action
      const result = await enhancePrd(formData);

      if (result.success && result.enhancedPrd) {
        setEnhancedPrd(result.enhancedPrd);
        toast({
          title: "Success",
          description: "PRD enhanced successfully",
        });
      } else if (result.needMoreCredits) {
        toast({
          title: "Out of Credits",
          description: "You need more prompt credits to enhance the PRD.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to enhance PRD",
          variant: "destructive",
        });
      }

      // Fetch updated credit count
      const creditsResponse = await fetchPromptCredits();
      if (creditsResponse.success && creditsResponse.credits) {
        setPromptCredits(creditsResponse.credits);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle updating the current PRD with the enhanced version and persisting to Firebase
  const handleUpdatePrd = async () => {
    if (!enhancedPrd || !feature?.id) return;

    try {
      setIsLoading(true);

      // Update local state
      setCurrentPrd(enhancedPrd);
      setEnhancedPrd("");

      // Update feature in Firebase with the new PRD content
      const result = await updateFeature(feature.id, feature.productId, {
        prdContent: enhancedPrd,
      });

      if (result.success) {
        // Update the feature atom with the new PRD content
        setFeature({
          ...feature,
          prdContent: enhancedPrd,
          updatedAt: Date.now(),
        });

        toast({
          title: "Success",
          description: "PRD updated and saved to database",
        });
      } else {
        throw new Error(result.error || "Failed to update feature");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update PRD",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current PRD */}
            <div className="space-y-2">
              <Label>Current PRD</Label>
              <Textarea
                value={currentPrd}
                onChange={(e) => setCurrentPrd(e.target.value)}
                className="h-[400px] font-mono text-sm"
              />
            </div>

            {/* Enhanced PRD */}
            <div className="space-y-2">
              <Label>Enhanced PRD</Label>
              <Textarea
                value={enhancedPrd}
                readOnly
                className="h-[400px] font-mono text-sm bg-muted"
                placeholder="Enhanced PRD will appear here after generation"
              />
            </div>
          </div>

          {/* Instructions and Actions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for AI</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Provide instructions for enhancing the PRD (e.g., 'Add more technical details', 'Focus on user benefits', etc.)"
                className="h-20"
              />
            </div>

            <div className="flex justify-end gap-2">
              {enhancedPrd && (
                <Button onClick={handleUpdatePrd} variant="outline">
                  Update Current PRD
                </Button>
              )}
              <Button
                onClick={handleEnhancePrd}
                disabled={!currentPrd || isEnhancing}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isEnhancing ? "Enhancing..." : "Enhance PRD"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
