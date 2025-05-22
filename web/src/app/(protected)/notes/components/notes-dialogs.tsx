"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { Phases } from "@/lib/firebase/schema";
import { firebaseNotes } from "@/lib/firebase/client/FirebaseNotes";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

interface NotesDialogsProps {
  onSuccess: () => void;
  onOptimisticAdd?: (note: Note) => void;
  onShowToast: (options: ShowToastOptions) => void;
}

export function NotesDialogs({ onSuccess, onShowToast }: NotesDialogsProps) {
  const [addModalOpen, setAddModalOpen] = useAtom(addNoteModalOpenAtom);
  const [editModalOpen, setEditModalOpen] = useAtom(editNoteModalOpenAtom);
  const [selectedNote, setSelectedNote] = useAtom(selectedNoteAtom);
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [, setAllNotes] = useAtom(allNotesAtom);

  // Form state
  const [noteBody, setNoteBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [phases, setPhases] = useState<Phases[]>([]);
  const [saving, setSaving] = useState(false);

  // XP mutation hook
  const xpMutation = useXpMutation();

  // Reset form when modal closes
  useEffect(() => {
    if (!addModalOpen && !editModalOpen) {
      setNoteBody("");
      setTags([]);
      setPhases([]);
    }
  }, [addModalOpen, editModalOpen]);

  // Load selected note data when editing
  useEffect(() => {
    if (selectedNote && (editModalOpen || addModalOpen)) {
      setNoteBody(selectedNote.note_body || "");
      setTags(selectedNote.tags || []);
      setPhases(selectedNote.phases || []);
    }
  }, [selectedNote, editModalOpen, addModalOpen]);

  const handlePhaseChange = (selected: string[]) => {
    setPhases(
      selected.filter((phase): phase is Phases =>
        Object.values(Phases).includes(phase as Phases)
      )
    );
  };

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (!selectedProduct) {
        throw new Error("No product selected");
      }
      setAddModalOpen(false);

      const timestamp = getCurrentUnixTimestamp();
      const noteData = {
        note_body: noteBody,
        phases,
        tags,
        productId: selectedProduct.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      // Create new note
      const savedNote = await firebaseNotes.createNote(noteData);
      setSelectedNote(savedNote);
      xpMutation.mutate("create_note");

      onShowToast({
        title: "Note added",
        description: "Your note has been added successfully",
        duration: TOAST_DEFAULT_DURATION,
      });
      onSuccess();
    } catch (error) {
      console.error("Error saving note:", error);
      onShowToast({
        title: "Error saving note",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      // Refresh the notes to ensure UI is consistent
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (!selectedProduct) {
        throw new Error("No product selected");
      }
      setEditModalOpen(false);

      const timestamp = getCurrentUnixTimestamp();
      const noteData = {
        note_body: noteBody,
        phases,
        tags,
        productId: selectedProduct.id,
        updatedAt: timestamp,
      };

      // Update existing note - only send fields that can be updated
      const savedNote = await firebaseNotes.updateNote(
        selectedNote?.id || "",
        noteData
      );
      setSelectedNote(savedNote);

      onShowToast({
        title: "Note updated",
        description: "Your note has been updated successfully",
        duration: TOAST_DEFAULT_DURATION,
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving note:", error);
      onShowToast({
        title: "Error saving note",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
      // Refresh the notes to ensure UI is consistent
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Add Note Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateNote}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-body">Note</Label>
                <Textarea
                  id="note-body"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Enter your note..."
                  className="min-h-[100px]"
                  data-testid="note-body-input"
                />
              </div>
              <div>
                <Label htmlFor="phases">Phases</Label>
                <MultiSelect
                  options={Object.values(Phases)
                    .filter((phase) => phase !== "All")
                    .map((phase) => ({
                      label: phase,
                      value: phase,
                    }))}
                  selected={phases}
                  onChange={handlePhaseChange}
                  placeholder="Select phases..."
                  data-testid="phases-select"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Add tags..."
                  data-testid="tags-input"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !noteBody.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateNote}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-note-body">Note</Label>
                <Textarea
                  id="edit-note-body"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Enter your note..."
                  className="min-h-[100px]"
                  data-testid="edit-note-body-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-phases">Phases</Label>
                <MultiSelect
                  options={Object.values(Phases)
                    .filter((phase) => phase !== "All")
                    .map((phase) => ({
                      label: phase,
                      value: phase,
                    }))}
                  selected={phases}
                  onChange={handlePhaseChange}
                  placeholder="Select phases..."
                  data-testid="edit-phases-select"
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Add tags..."
                  data-testid="edit-tags-input"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedNote(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !noteBody.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
