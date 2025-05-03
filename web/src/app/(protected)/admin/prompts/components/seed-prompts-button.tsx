"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { seedPrompts } from "@/app/actions/seed-prompts";
import { Loader2 } from "lucide-react";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

export function SeedPromptsButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedPrompts = async () => {
    try {
      setIsSeeding(true);
      const result = await seedPrompts();

      if (result.success) {
        toast({
          title: "Success",
          duration: TOAST_DEFAULT_DURATION,
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          duration: TOAST_DEFAULT_DURATION,
          description: result.error || "Failed to seed prompts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error seeding prompts:", error);
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description: "An error occurred while seeding prompts",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleSeedPrompts}
      disabled={isSeeding}
    >
      {isSeeding ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Seeding Prompts...
        </>
      ) : (
        "Seed Prompts Database"
      )}
    </Button>
  );
}
