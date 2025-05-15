"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAssetAction } from "../actions/asset-actions";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { atom, useSetAtom } from "jotai";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Create an atom to store the newly created asset ID
export const newlyCreatedAssetIdAtom = atom<string | null>(null);

export function AddAssetButton() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<string>("Discover");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const setNewlyCreatedAssetId = useSetAtom(newlyCreatedAssetIdAtom);

  const handleAddAsset = async () => {
    if (!selectedProductId || !title || !phase || !content) return;

    setIsSaving(true);

    try {
      const assetId = uuidv4();
      const response = await saveAssetAction({
        productId: selectedProductId,
        asset: {
          id: assetId,
          phase: phase as
            | "Discover"
            | "Validate"
            | "Design"
            | "Build"
            | "Secure"
            | "Launch"
            | "Grow",
          title: title,
          description: description || title,
          systemPrompt: "Custom asset created by user", // Default prompt
          tags: [phase],
          order: 999, // High order to show at end of list
          content: content,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setPhase("Discover");
      setContent("");
      setDialogOpen(false);

      // Set the newly created asset ID for selection
      // Add a small delay to ensure the asset is properly added to Firestore before selection
      setTimeout(() => {
        console.log("Setting newly created asset ID:", assetId);
        setNewlyCreatedAssetId(assetId);
      }, 100);

      toast({
        title: "Asset added",
        description: "Your custom asset has been added successfully.",
        duration: TOAST_DEFAULT_DURATION,
      });
    } catch (error) {
      console.error("Error adding asset:", error);
      toast({
        title: "Error adding asset",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        className="flex items-center gap-2 bg-black text-white hover:bg-black/90"
        onClick={() => setDialogOpen(true)}
        data-testid="generate-asset-button"
      >
        <Plus className="h-4 w-4" />
        Add Asset
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Asset</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Custom Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="asset-title-input"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of this asset"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="asset-description-input"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phase">Phase</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger id="phase" data-testid="asset-phase-select">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Discover">Discover</SelectItem>
                  <SelectItem value="Validate">Validate</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Build">Build</SelectItem>
                  <SelectItem value="Secure">Secure</SelectItem>
                  <SelectItem value="Launch">Launch</SelectItem>
                  <SelectItem value="Grow">Grow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                className="min-h-[200px]"
                placeholder="Enter document content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                data-testid="asset-prompt-input"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleAddAsset}
              disabled={isSaving || !title || !phase || !content}
              className="bg-black text-white hover:bg-black/90"
              data-testid="start-generation-button"
            >
              {isSaving ? "Adding..." : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
