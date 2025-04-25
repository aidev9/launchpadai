"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useXp } from "@/xp/useXp";
// Import toast function just for type extraction
import { toast as showToast } from "@/hooks/use-toast";
import { Note } from "./notes-store";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

interface NotesDialogsProps {
  onSuccess: () => void;
  onOptimisticAdd?: (note: Note) => void; // Use Note type
  onShowToast: (options: ShowToastOptions) => void; // Use the extracted type
}

export function NotesDialogs({
  onSuccess,
  onOptimisticAdd,
  onShowToast, // Receive the prop with the correct type
}: NotesDialogsProps) {
  const [open, setOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const { awardXp } = useXp();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-note-dialog", handler);
    return () => window.removeEventListener("open-add-note-dialog", handler);
  }, []);

  const handleSave = async () => {
    console.log("handleSave called", {
      selectedProductId,
      noteBody: noteBody.trim(),
    });
    if (!selectedProductId || !noteBody.trim()) return;
    setSaving(true);
    try {
      // Process tags - split by comma, trim whitespace, and remove empty tags
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Create the note data
      const noteId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const noteData = {
        id: noteId,
        note_body: noteBody,
        tags,
        last_modified: timestamp,
      };

      // Close dialog and clear inputs immediately for better user experience
      setOpen(false);
      const prevNoteBody = noteBody;
      const prevTagsInput = tagsInput;
      setNoteBody("");
      setTagsInput("");

      // Perform optimistic update if the handler is provided
      if (onOptimisticAdd) {
        onOptimisticAdd(noteData);
      } else {
        // Otherwise fall back to full reload
        onSuccess();
      }

      // Use the API route instead of direct server function call
      const res = await fetch("/api/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId, noteData }),
      });

      const result = await res.json();
      console.log("API Save Result for Note:", result);

      if (result.success) {
        // --- Award XP and show toast via callback ---
        const createNoteActionId = "create_note";
        const pointsAwarded = 5; // Match points from points-schedule.ts
        console.log(
          `Note created. Attempting XP award for action: ${createNoteActionId}`
        );
        try {
          await awardXp(createNoteActionId);
          // Use callback for success toast with XP
          onShowToast({
            title: "Note added",
            description: `Your note has been added successfully and you earned ${pointsAwarded} XP!`,
            duration: 5000,
          });
        } catch (error) {
          console.log("error:", error);
          onShowToast({
            title: "Note added",
            description: "Your note has been added successfully.",
            duration: 5000,
          });
        }
        // --- End XP Award ---
      } else {
        // Handle server save failure - use callback for error toast
        onShowToast({
          title: "Error saving note",
          description: result.error,
          variant: "destructive",
        });
        setNoteBody(prevNoteBody);
        setTagsInput(prevTagsInput);
        setOpen(true);

        // Reset the optimistic update by calling onSuccess to refresh data
        if (onOptimisticAdd) {
          onSuccess();
        }
      }
    } catch (error) {
      // Handle general error - use callback for error toast
      onShowToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      // Reset by refreshing data
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note-body">Note</Label>
            <Textarea
              id="note-body"
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Enter your note..."
              disabled={saving}
              className="min-h-[120px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">
              Tags{" "}
              <span className="text-muted-foreground text-xs">
                (comma separated)
              </span>
            </Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. important, follow-up, idea"
              disabled={saving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !noteBody.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
