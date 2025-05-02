import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSetAtom } from "jotai";
import { initialLoadAtom } from "@/lib/store/prompt-store";
import { addPromptAction } from "@/lib/firebase/actions/prompts";

// Sample prompts for seeding the database
const SAMPLE_PHASES = [
  "Discover",
  "Validate",
  "Design",
  "Build",
  "Secure",
  "Launch",
  "Grow",
];
const SAMPLE_PRODUCTS = [
  "SaaS",
  "Mobile App",
  "E-commerce",
  "Marketplace",
  "Web App",
];

export function SeedPromptsButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  const setInitialLoad = useSetAtom(initialLoadAtom);

  const handleSeed = async () => {
    if (!confirm("This will add sample prompts to the database. Continue?")) {
      return;
    }

    setIsSeeding(true);
    let addedCount = 0;
    let failedCount = 0;

    try {
      // We'll add 10 prompts per phase
      for (const phase of SAMPLE_PHASES) {
        for (let i = 1; i <= 10; i++) {
          // Create a random prompt
          const productTags = [
            SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)],
          ];

          const prompt = {
            title: `${phase} Prompt #${i}`,
            body: `This is a sample prompt for the ${phase} phase.\n\n## Steps to follow:\n\n1. First, understand the requirements\n2. Analyze the data\n3. Create a plan\n4. Execute and iterate\n\nRemember to always validate your assumptions.`,
            phaseTags: [phase],
            productTags,
            tags: ["sample", phase.toLowerCase(), "generated"],
          };

          // Use the server action to add the prompt
          const result = await addPromptAction(prompt);

          if (result.success) {
            addedCount++;
          } else {
            failedCount++;
            console.error("Failed to add sample prompt:", result.error);
          }
        }
      }

      toast({
        title: "Database Seeded",
        description: `Successfully added ${addedCount} sample prompts to the database${
          failedCount > 0 ? `. Failed to add ${failedCount} prompts.` : "."
        }`,
      });

      // Toggle initialLoad to trigger a refresh
      setInitialLoad((prev) => !prev);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while seeding the database",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSeed} disabled={isSeeding}>
      <Database className="mr-2 h-4 w-4" />
      {isSeeding ? "Seeding..." : "Seed Database"}
    </Button>
  );
}
