"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useXpMutation } from "@/xp/useXpMutation";
import { toast as showToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/ui/tag-input";
import {
  Note,
  addNoteModalOpenAtom,
  editNoteModalOpenAtom,
  selectedNoteAtom,
  allNotesAtom,
} from "./notes-store";
import {
  getCurrentUnixTimestamp,
  TOAST_DEFAULT_DURATION,
} from "@/utils/constants";
import { createNote, updateNote } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { clientAuth } from "@/lib/firebase/client";

const userId = clientAuth.currentUser?.uid;

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

interface NotesDialogsProps {
  onSuccess: () => void;
  onOptimisticAdd?: (note: Note) => void;
  onShowToast: (options: ShowToastOptions) => void;
}

export function NotesDialogs({
  onSuccess,
  onOptimisticAdd,
  onShowToast,
}: NotesDialogsProps) {
  const [addModalOpen, setAddModalOpen] = useAtom(addNoteModalOpenAtom);
  const [editModalOpen, setEditModalOpen] = useAtom(editNoteModalOpenAtom);
  const [selectedNote, setSelectedNote] = useAtom(selectedNoteAtom);
  const [allNotes, setAllNotes] = useAtom(allNotesAtom);

  const [noteBody, setNoteBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedProductId] = useAtom(selectedProductIdAtom);

  // Use the common XP mutation hook
  const xpMutation = useXpMutation();

  // Update form when editing a note
  useEffect(() => {
    if (selectedNote && editModalOpen) {
      setNoteBody(selectedNote.note_body);
      setTags(selectedNote.tags || []);
    }
  }, [selectedNote, editModalOpen]);

  // Reset form when opening the add modal
  useEffect(() => {
    if (addModalOpen) {
      setNoteBody("");
      setTags([]);
    }
  }, [addModalOpen]);

  async function handleSaveWithServerAction(formData: FormData) {
    setSaving(true);

    try {
      // Get data for optimistic update
      const noteBody = formData.get("noteBody") as string;

      // Close dialog and reset form
      setAddModalOpen(false);
      setNoteBody("");
      setTags([]);

      // Ensure selectedProductId is a string
      if (!selectedProductId) {
        onShowToast({
          title: "Error",
          description: "No product selected.",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        setSaving(false);
        return;
      }
      // Call server action to save the note
      const result = await createNote({
        productId: selectedProductId,
        noteBody: noteBody,
        tags: tags,
      });

      if (result.success) {
        // Create the new note object with the server response data
        const newNote: Note = {
          // Use a fallback id if not present (e.g., Date.now().toString())
          id:
            result.note && "id" in result.note
              ? (result.note as any).id
              : Date.now().toString(),
          note_body: result.note?.note_body || noteBody,
          tags: result.note?.tags || tags,
          createdAt: result.note?.createdAt || getCurrentUnixTimestamp(),
          updatedAt: result.note?.updatedAt || getCurrentUnixTimestamp(),
        };

        // Update the allNotes atom directly
        setAllNotes((prevNotes) => [newNote, ...prevNotes]);

        // Award XP for creating a note - using background mutation
        const createNoteActionId = "create_note";
        const pointsAwarded = 5;

        // Fire XP award in background without waiting
        xpMutation.mutate(createNoteActionId);

        // Show success toast immediately
        onShowToast({
          title: "Note added",
          description: `Your note has been added successfully and you earned ${pointsAwarded} XP!`,
          duration: TOAST_DEFAULT_DURATION,
        });

        // Call onSuccess to ensure any additional refreshing logic is executed
        onSuccess();
      } else {
        onShowToast({
          title: "Error saving note",
          description: result.error || "Failed to save note",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        // Refresh the notes to ensure UI is consistent
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving note:", error);
      onShowToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateWithServerAction(formData: FormData) {
    if (!selectedProductId || !selectedNote?.id) {
      console.error("Missing required data for update: ", {
        selectedProductId,
        noteId: selectedNote?.id,
      });
      return;
    }
    setSaving(true);

    try {
      // Get form data for the update
      const noteBody = formData.get("noteBody") as string;

      // Store the note ID for reference in case selectedNote becomes null
      const noteId = selectedNote.id;

      // Close dialog and reset state
      setEditModalOpen(false);
      setNoteBody("");
      setTags([]);
      setSelectedNote(null);

      // Call server action to update the note
      const result = await updateNote({
        productId: selectedProductId,
        noteId: noteId,
        noteBody: noteBody,
        tags: tags,
      });

      if (result.success) {
        // Update the allNotes atom with the updated note data
        setAllNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  note_body: noteBody,
                  tags: tags,
                  updatedAt: getCurrentUnixTimestamp(),
                }
              : note
          )
        );

        onShowToast({
          title: "Note updated",
          description: "Your note has been updated successfully.",
          duration: TOAST_DEFAULT_DURATION,
        });

        // Call onSuccess to ensure any additional refresh logic is executed
        onSuccess();
      } else {
        onShowToast({
          title: "Error updating note",
          description: result.error || "Failed to update note",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        // Refresh to ensure UI is consistent
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating note:", error);
      onShowToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Add Note Dialog */}
      <Dialog
        open={addModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <form action={handleSaveWithServerAction}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="note-body">Note</Label>
                <Textarea
                  id="note-body"
                  name="noteBody"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Enter your note..."
                  disabled={saving}
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Type and press Enter to add tags..."
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving || !noteBody.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog
        open={editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditModalOpen(false);
            setSelectedNote(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <form action={handleUpdateWithServerAction}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-note-body">Note</Label>
                <Textarea
                  id="edit-note-body"
                  name="noteBody"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Enter your note..."
                  disabled={saving}
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Type and press Enter to add tags..."
                  disabled={saving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving || !noteBody.trim()}>
                {saving ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
