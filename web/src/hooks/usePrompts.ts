import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import {
  allPromptsAtom,
  userPromptsAtom,
  promptPhaseFilterAtom,
  promptSearchQueryAtom,
  selectedPromptAtom,
  selectedPromptIdAtom,
  filteredPromptsAtom,
  filteredUserPromptsAtom,
  promptsLoadingAtom,
  promptsErrorAtom,
} from "@/lib/store/prompt-store";
import {
  getAllPromptsAction,
  getPromptAction,
  getUserPromptsAction,
} from "@/lib/firebase/actions/prompts";

interface UsePromptsProps {
  userPromptsOnly?: boolean;
  loadPrompts?: boolean;
}

export function usePrompts({
  userPromptsOnly = false,
  loadPrompts = true,
}: UsePromptsProps = {}) {
  // State atoms
  const [allPrompts, setAllPrompts] = useAtom(allPromptsAtom);
  const [userPrompts, setUserPrompts] = useAtom(userPromptsAtom);
  const [isLoading, setIsLoading] = useAtom(promptsLoadingAtom);
  const [error, setError] = useAtom(promptsErrorAtom);

  // Filter atoms
  const [phaseFilter, setPhaseFilter] = useAtom(promptPhaseFilterAtom);
  const [searchQuery, setSearchQuery] = useAtom(promptSearchQueryAtom);

  // Selection atoms
  const [selectedPrompt, setSelectedPrompt] = useAtom(selectedPromptAtom);
  const [selectedPromptId, setSelectedPromptId] = useAtom(selectedPromptIdAtom);

  // Filtered results
  const [filteredPrompts] = useAtom(
    userPromptsOnly ? filteredUserPromptsAtom : filteredPromptsAtom
  );

  // Fetch all prompts once
  const fetchAllPrompts = useCallback(
    async (forceRefresh = false) => {
      // Skip if we already have data and aren't forcing a refresh
      if (!forceRefresh && allPrompts.length > 0) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await getAllPromptsAction();

        if (result.success) {
          setAllPrompts(result.prompts || []);
        } else {
          setError(result.error || "Failed to fetch prompts");
          setAllPrompts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setAllPrompts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [allPrompts.length, setAllPrompts, setIsLoading, setError]
  );

  // Fetch user prompts once
  const fetchUserPrompts = useCallback(
    async (forceRefresh = false) => {
      // Skip if we already have data and aren't forcing a refresh
      if (!forceRefresh && userPrompts.length > 0) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await getUserPromptsAction();

        if (result.success) {
          setUserPrompts(result.prompts || []);
        } else {
          setError(result.error || "Failed to fetch user prompts");
          setUserPrompts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setUserPrompts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [userPrompts.length, setUserPrompts, setIsLoading, setError]
  );

  // Get a specific prompt by ID
  const fetchPromptById = useCallback(
    async (promptId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to find prompt in existing collections first
        let foundPrompt =
          allPrompts.find((p) => p.id === promptId) ||
          userPrompts.find((p) => p.id === promptId);

        // If not found locally, fetch from server
        if (!foundPrompt) {
          const result = await getPromptAction(promptId);

          if (result.success && result.prompt) {
            foundPrompt = result.prompt;

            // Update the appropriate atom with the new prompt data
            // Check if the prompt already exists in user prompts - if so, it's a user prompt
            const isUserPrompt =
              userPrompts.some((p) => p.id === promptId) ||
              result.prompt.tags.includes("user");

            if (isUserPrompt) {
              // Add to user prompts if it's not already there
              if (!userPrompts.some((p) => p.id === promptId)) {
                setUserPrompts((prev) => [...prev, result.prompt!]);
              }
            } else {
              // Add to all prompts if it's not already there
              if (!allPrompts.some((p) => p.id === promptId)) {
                setAllPrompts((prev) => [...prev, result.prompt!]);
              }
            }
          } else {
            setError(result.error || "Failed to fetch prompt");
            return null;
          }
        }

        // Update selected prompt
        setSelectedPrompt(foundPrompt);
        setSelectedPromptId(foundPrompt.id ?? null);
        return foundPrompt;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      allPrompts,
      userPrompts,
      setAllPrompts,
      setUserPrompts,
      setSelectedPrompt,
      setSelectedPromptId,
      setIsLoading,
      setError,
    ]
  );

  // Clear the selected prompt
  const clearPromptSelection = useCallback(() => {
    setSelectedPrompt(null);
    setSelectedPromptId(null);
  }, [setSelectedPrompt, setSelectedPromptId]);

  // Load prompts on initial mount if requested
  useEffect(() => {
    if (!loadPrompts) return;

    if (userPromptsOnly) {
      fetchUserPrompts();
    } else {
      fetchAllPrompts();
    }
  }, [userPromptsOnly, fetchAllPrompts, fetchUserPrompts, loadPrompts]);

  return {
    prompts: filteredPrompts,
    isLoading,
    setIsLoading,
    error,
    fetchAllPrompts,
    fetchUserPrompts,
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
