"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Main } from "@/components/layout/main";
import { ChevronLeft, Copy, FileText, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import { copyPromptToUserCollectionAction } from "@/lib/firebase/actions/prompts";
import { useAtom } from "jotai";
import { selectedPromptAtom } from "@/lib/store/prompt-store";
import { useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Playground from "./playground";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

export default function PromptDetail() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompt] = useAtom(selectedPromptAtom);
  const [isCopying, setIsCopying] = useState(false);

  const handleUseAsTemplate = async () => {
    if (!prompt) return;

    setIsCopying(true);
    try {
      // Copy the prompt to the user's collection, using the current prompt body from atom
      // which might contain enhanced content if user clicked "Keep"
      const result = await copyPromptToUserCollectionAction(
        prompt.id!,
        prompt.body
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Prompt copied to your collection",
          duration: TOAST_DEFAULT_DURATION,
        });

        // Navigate to /myprompts
        router.push("/myprompts/prompt");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to copy prompt",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        duration: TOAST_DEFAULT_DURATION,
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  // Render no prompt selected state
  if (!prompt) {
    return (
      <Main>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No prompt selected</h2>
          <p className="text-muted-foreground mt-2">
            Please select a prompt from the prompts list
          </p>
          <Button
            onClick={() => router.push("/prompts")}
            variant="outline"
            className="mt-4"
          >
            Back
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Prompts", href: "/prompts" },
            { label: prompt.title, isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{prompt.title}</h1>

          <div className="flex gap-2">
            {/* <Button variant="outline" onClick={handleCopyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button> */}
            <Button onClick={handleUseAsTemplate} disabled={isCopying}>
              <FileText className="mr-2 h-4 w-4" />
              {isCopying ? "Copying..." : "Use as Template"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {prompt.phaseTags.map((tag) => (
            <Badge key={tag} variant="secondary" className={getPhaseColor(tag)}>
              {tag}
            </Badge>
          ))}
          {prompt.productTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
          {prompt.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="bg-muted">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Start Playground */}
        <Playground prompt={prompt} />
        {/* End Playground */}
      </div>
    </Main>
  );
}
