import { atom } from "jotai";
import { Agent } from "@/lib/firebase/schema";
import { firebaseAgents } from "@/lib/firebase/client/FirebaseAgents";

// View mode atom (grid or table)
export const agentLayoutViewAtom = atom<"card" | "table">("card");

// Phase filter atom
export const agentPhaseFilterAtom = atom<string[]>([]);

// Search query atom
export const agentSearchQueryAtom = atom<string>("");

// Selected agent atom
export const selectedAgentAtom = atom<Agent | null>(null);

// Agent wizard state atom
export const agentWizardStateAtom = atom<Agent | null>(null);

// Current wizard step atom
export const currentWizardStepAtom = atom<number>(1);

// Edit mode atom
export const isEditModeAtom = atom<boolean>(false);

// Table row selection atom
export const agentTableRowSelectionAtom = atom<Record<string, boolean>>({});

// Optimistic update atoms for delete operations
export const deleteAgentAtom = atom(null, async (get, set, agentId: string) => {
  try {
    // Optimistic update - remove from UI immediately
    const result = await firebaseAgents.deleteAgent(agentId);
    return { success: result };
  } catch (error) {
    console.error("[deleteAgentAtom] Error:", error);
    return { success: false, error };
  }
});

export const deleteMultipleAgentsAtom = atom(
  null,
  async (get, set, agentIds: string[]) => {
    try {
      // Map over all agent IDs and delete them
      const deletePromises = agentIds.map((id) =>
        firebaseAgents.deleteAgent(id)
      );
      const results = await Promise.all(deletePromises);

      // Check if all deletions were successful
      const allSuccessful = results.every((result) => result === true);

      return { success: allSuccessful };
    } catch (error) {
      console.error("[deleteMultipleAgentsAtom] Error:", error);
      return { success: false, error };
    }
  }
);
