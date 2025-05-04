"use client";

import { useRouter } from "next/navigation";
import { Main } from "@/components/layout/main";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search as SearchIcon,
  LayoutGrid,
  Table as TableIcon,
  X,
} from "lucide-react";
import { usePrompts } from "@/hooks/usePrompts";
import { PhaseFilter } from "@/components/prompts/phase-filter";
import { PromptCard } from "@/components/prompts/prompt-card";
import { Prompt } from "@/lib/firebase/schema";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { toast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { copyPromptToUserCollectionAction } from "@/lib/firebase/actions/prompts";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { layoutViewAtom } from "@/lib/store/prompt-store";
import { PromptTable } from "./components/prompt-table";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function PromptsBrowse() {
  const router = useRouter();
  const {
    prompts,
    isLoading,
    setIsLoading,
    error,
    phaseFilter,
    setPhaseFilter,
    searchQuery,
    setSearchQuery,
    setSelectedPrompt,
  } = usePrompts();

  const [layoutView, setLayoutView] = useAtom(layoutViewAtom);

  // Initialize to card view by default when component mounts
  useEffect(() => {
    setLayoutView("card");
  }, [setLayoutView]);

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    router.push("/prompts/prompt");
  };

  const handleUseAsTemplate = async (prompt: Prompt) => {
    if (!prompt) return;

    setIsLoading(true);
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

        // Set the current prompt in the atom
        setSelectedPrompt(result.prompt as Prompt);

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
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Main>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Prompts", isCurrentPage: true },
          ]}
        />

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
        </div>

        {/* Filter and Search row */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Phase filter pills */}
          <div className="w-full md:flex-1 overflow-x-auto pb-2">
            <div className="inline-flex md:flex flex-nowrap md:flex-wrap">
              <PhaseFilter
                selectedPhases={phaseFilter}
                onChange={setPhaseFilter}
              />
            </div>
          </div>

          {/* Search bar and view toggles */}
          <div className="flex gap-2 w-full md:w-auto">
            {/* Search bar */}
            <div className="relative w-full md:w-[18rem] flex-shrink-0">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View toggle buttons */}
            <div className="flex border rounded-md">
              <Button
                variant={layoutView === "card" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("card")}
                className="rounded-r-none"
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={layoutView === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => setLayoutView("table")}
                className="rounded-l-none"
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && prompts.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">No prompts found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Prompt cards grid */}
        {!isLoading &&
          !error &&
          prompts.length > 0 &&
          layoutView === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onClick={handlePromptClick}
                  onUseAsTemplate={(prompt) => handleUseAsTemplate(prompt)}
                />
              ))}
            </div>
          )}

        {/* Prompt table view */}
        {!isLoading &&
          !error &&
          prompts.length > 0 &&
          layoutView === "table" && (
            <PromptTable
              prompts={prompts}
              onClick={handlePromptClick}
              onUseAsTemplate={handleUseAsTemplate}
            />
          )}
      </div>
    </Main>
  );
}
