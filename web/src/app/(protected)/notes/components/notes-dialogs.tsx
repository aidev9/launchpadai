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
import { toast } from "@/components/ui/use-toast";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useXp } from "@/xp/useXp";

interface NotesDialogsProps {
  onSuccess: () => void;
  onOptimisticAdd?: (note: any) => void;
}

export function NotesDialogs({
  onSuccess,
  onOptimisticAdd,
}: NotesDialogsProps) {
  const [open, setOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const { refreshXp } = useXp();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-note-dialog", handler);
    return () => window.removeEventListener("open-add-note-dialog", handler);
  }, []);

  const handleSave = async () => {
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

      if (result.success) {
        toast({ title: "Note added" });
        // Refresh XP after successful note creation
        console.log("Note created, refreshing XP...");
        refreshXp().catch((err) =>
          console.error("Failed to refresh XP after note creation:", err)
        );
      } else {
        // If server save fails, show error and reopen the dialog with previous values
        toast({
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
      toast({
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
