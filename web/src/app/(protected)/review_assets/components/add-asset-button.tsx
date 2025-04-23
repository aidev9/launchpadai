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
import { saveAsset } from "@/lib/firebase/assets";
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

// Create an atom to store the newly created asset ID
export const newlyCreatedAssetIdAtom = atom<string | null>(null);

export function AddAssetButton() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [phase, setPhase] = useState<string>("Discover");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const setNewlyCreatedAssetId = useSetAtom(newlyCreatedAssetIdAtom);

  const handleAddAsset = async () => {
    if (!selectedProductId || !documentName || !phase || !content) return;

    setIsSaving(true);

    try {
      const assetId = uuidv4();
      const response = await saveAssetAction({
        productId: selectedProductId,
        asset: {
          id: assetId,
          phase: phase as any, // Cast to Asset["phase"]
          document: documentName,
          systemPrompt: "Custom asset created by user", // Default prompt
          order: 999, // High order to show at end of list
          content: content,
        },
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      // Reset form and close dialog
      setDocumentName("");
      setPhase("Discover");
      setContent("");
      setDialogOpen(false);

      // Set the newly created asset ID for selection
      setNewlyCreatedAssetId(assetId);

      toast({
        title: "Asset added",
        description: "Your custom asset has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding asset:", error);
      toast({
        title: "Error adding asset",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
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
              <Label htmlFor="document-name">Document Name</Label>
              <Input
                id="document-name"
                placeholder="e.g. Custom Report.md"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phase">Phase</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger id="phase">
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
              disabled={isSaving || !documentName || !phase || !content}
              className="bg-black text-white hover:bg-black/90"
            >
              {isSaving ? "Adding..." : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
