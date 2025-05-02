import { useState, useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  promptPhaseFilterAtom,
  promptSearchQueryAtom,
  selectedPromptAtom,
  selectedPromptIdAtom,
} from "@/lib/store/prompt-store";
import {
  getAllPromptsAction,
  getPromptsByPhaseAction,
  getPromptAction,
  getUserPromptsAction,
  getUserPromptsByPhaseAction,
} from "@/lib/firebase/actions/prompts";
import { Prompt } from "@/lib/firebase/schema";

interface UsePromptsProps {
  userPromptsOnly?: boolean;
}

export function usePrompts({ userPromptsOnly = false }: UsePromptsProps = {}) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPrompt, setSelectedPrompt] = useAtom(selectedPromptAtom);
  const [selectedPromptId, setSelectedPromptId] = useAtom(selectedPromptIdAtom);
  const [phaseFilter, setPhaseFilter] = useAtom(promptPhaseFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(promptSearchQueryAtom);

  // Fetch all prompts or filtered prompts based on phase tags
  const fetchPrompts = useCallback(
    async (forceRefresh = false) => {
      try {
        setIsLoading(true);
        setError(null);

        let result;
        if (phaseFilter.length > 0) {
          if (userPromptsOnly) {
            result = await getUserPromptsByPhaseAction(phaseFilter);
          } else {
            result = await getPromptsByPhaseAction(phaseFilter);
          }
        } else {
          if (userPromptsOnly) {
            result = await getUserPromptsAction();
          } else {
            result = await getAllPromptsAction();
          }
        }

        if (result.success) {
          // Set prompts from the result
          setPrompts(result.prompts || []);
        } else {
          setError(result.error || "Failed to fetch prompts");
          setPrompts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [phaseFilter, userPromptsOnly]
  );

  // Get a specific prompt by ID
  const fetchPromptById = useCallback(
    async (promptId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getPromptAction(promptId);

        if (result.success && result.prompt) {
          setSelectedPrompt(result.prompt);
          setSelectedPromptId(result.prompt.id);
          return result.prompt;
        } else {
          setError(result.error || "Failed to fetch prompt");
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setSelectedPrompt, setSelectedPromptId]
  );

  // Clear the selected prompt
  const clearPromptSelection = useCallback(() => {
    setSelectedPrompt(null);
    setSelectedPromptId(null);
  }, [setSelectedPrompt, setSelectedPromptId]);

  // Filter prompts based on search query
  const filteredPrompts = searchQuery
    ? prompts.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : prompts;

  // Load prompts on initial mount or when filters change
  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts: filteredPrompts,
    isLoading,
    error,
    fetchPrompts,
    fetchPromptById,
    selectedPrompt,
    setSelectedPrompt,
    selectedPromptId,
    setSelectedPromptId,
    clearPromptSelection,
    phaseFilter,
    setPhaseFilter,
    searchQuery,
    setSearchQuery,
  };
}
