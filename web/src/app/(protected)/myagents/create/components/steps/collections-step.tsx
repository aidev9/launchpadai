"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { agentWizardStateAtom } from "@/lib/store/agent-store";
import { Label } from "@/components/ui/label";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseCollections } from "@/lib/firebase/client/FirebaseCollections";
import { Collection } from "@/lib/firebase/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

export function CollectionsStep() {
  const [wizardState, setWizardState] = useAtom(agentWizardStateAtom);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    wizardState?.collections || []
  );

  // Fetch collections from Firebase
  const [collections, isLoading, error] = useCollectionData(
    firebaseCollections.getCollections(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format collections data
  const formattedCollections = (collections || []).map((collection) => {
    return {
      ...collection,
      id: collection.id,
    } as Collection;
  });

  // Convert collections to multi-select options
  const collectionOptions: MultiSelectOption[] = formattedCollections.map(
    (collection) => ({
      label: collection.title,
      value: collection.id,
    })
  );

  // Update the wizard state when selected collections change
  useEffect(() => {
    if (wizardState) {
      // Only update if values have changed to prevent unnecessary renders
      if (
        JSON.stringify(wizardState.collections) !==
        JSON.stringify(selectedCollections)
      ) {
        setWizardState({
          ...wizardState,
          collections: selectedCollections,
        });
      }
    }
  }, [selectedCollections, setWizardState, wizardState]);

  // Handle collection selection change
  const handleCollectionChange = (selected: string[]) => {
    setSelectedCollections(selected);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Knowledge Collections</Label>
          <p className="text-sm text-muted-foreground">
            Select collections to use as a knowledge base for your agent.
          </p>
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Knowledge Collections</Label>
          <p className="text-sm text-muted-foreground">
            Select collections to use as a knowledge base for your agent.
          </p>
        </div>
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          Error loading collections: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Knowledge Collections</Label>
        <p className="text-sm text-muted-foreground">
          Select collections to use as a knowledge base for your agent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="collections-select">Collections</Label>
        <MultiSelect
          options={collectionOptions}
          selected={selectedCollections}
          onChange={handleCollectionChange}
          placeholder={
            collectionOptions.length === 0
              ? "No collections available. Create collections in My Collections section."
              : "Search and select collections..."
          }
          disabled={collectionOptions.length === 0}
          className="w-full"
        />
        {selectedCollections.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedCollections.length} collection
            {selectedCollections.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {collectionOptions.length === 0 && !isLoading && (
        <div className="p-4 border border-gray-200 rounded-md text-center">
          <p className="text-sm text-muted-foreground">
            No collections found. Create collections in the{" "}
            <span className="font-medium">My Collections</span> section to add
            them to your agent.
          </p>
        </div>
      )}
    </div>
  );
}
