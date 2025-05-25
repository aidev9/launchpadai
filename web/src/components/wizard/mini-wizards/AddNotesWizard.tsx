import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MiniWizardId } from "@/lib/firebase/schema/enums";
import MiniWizardBase, { MiniWizardProps } from "./MiniWizardBase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notesAtom, productAtom, Note } from "@/lib/store/product-store";
import { PlusCircle, Save, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { firebaseNotes } from "@/lib/firebase/client/FirebaseNotes";
import { Note as FirebaseNote, Phases } from "@/lib/firebase/schema";
import { toast } from "@/hooks/use-toast";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Form schema for wizard notes
const noteSchema = z.object({
  title: z.string().min(2, {
    message: "Note title must be at least 2 characters.",
  }),
  content: z.string().min(10, {
    message: "Note content must be at least 10 characters.",
  }),
  category: z.enum([
    "general",
    "technical",
    "business",
    "user-feedback",
    "improvement",
    "other",
  ]),
  importance: z.enum(["high", "medium", "low"]),
});

type NoteFormValues = z.infer<typeof noteSchema>;

// Mapping function from wizard Note to Firebase Note
const mapWizardNoteToFirebaseNote = (
  wizardNote: Note,
  productId: string
): Omit<FirebaseNote, "id"> => {
  // Map category to phases - this is a simple mapping, you can make it more sophisticated
  const categoryToPhases: Record<string, Phases[]> = {
    general: [Phases.ALL],
    technical: [Phases.BUILD, Phases.DESIGN],
    business: [Phases.DISCOVER, Phases.VALIDATE],
    "user-feedback": [Phases.VALIDATE, Phases.GROW],
    improvement: [Phases.ALL],
    other: [Phases.ALL],
  };

  return {
    note_body: `${wizardNote.title}\n\n${wizardNote.content}`,
    phases: categoryToPhases[wizardNote.category] || [Phases.ALL],
    tags: wizardNote.tags || [
      wizardNote.category,
      wizardNote.importance || "medium",
    ],
    productId,
    createdAt: wizardNote.createdAt || getCurrentUnixTimestamp(),
    updatedAt: wizardNote.updatedAt || getCurrentUnixTimestamp(),
  };
};

export default function AddNotesWizard({
  onBack,
  onComplete,
}: Omit<
  MiniWizardProps,
  "miniWizardId" | "title" | "description" | "xpReward"
>) {
  const [product] = useAtom(productAtom);
  const [notes, setNotes] = useAtom(notesAtom);
  const [isFormValid, setIsFormValid] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);

  // Initialize form with default values
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      importance: "medium",
    },
    mode: "onChange",
  });

  // Monitor form validity
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsFormValid(form.formState.isValid);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Persist notes to Firebase
  const persistNotesToFirebase = async () => {
    if (!product?.id) {
      console.log(
        "[AddNotesWizard] No product ID available, skipping Firebase persistence"
      );
      return true; // Consider this successful since there's nothing to persist
    }

    if (notes.length === 0) {
      console.log(
        "[AddNotesWizard] No notes to persist, skipping Firebase persistence"
      );
      return true; // Consider this successful since there's nothing to persist
    }

    try {
      console.log("[AddNotesWizard] Persisting notes to Firebase:", notes);

      // Convert notes to the format expected by Firebase
      const notesToCreate = notes.map((note) =>
        mapWizardNoteToFirebaseNote(note, product.id!)
      );

      // Use batch create for all notes
      const success = await firebaseNotes.createNotes(notesToCreate);

      if (success) {
        console.log(
          "[AddNotesWizard] Successfully persisted notes to Firebase"
        );
        toast({
          title: "Notes Saved",
          description: `Successfully saved ${notes.length} notes to Firebase`,
        });
        return true;
      } else {
        console.error("[AddNotesWizard] Failed to persist notes to Firebase");
        toast({
          title: "Partial Success",
          description:
            "Notes were added to wizard but may not have been saved to database",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error(
        "[AddNotesWizard] Error persisting notes to Firebase:",
        error
      );
      toast({
        title: "Warning",
        description:
          "Notes were added to wizard but may not have been saved to database",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle wizard completion - this will be called by the main wizard when user clicks "Add Notes"
  const handleWizardComplete = async (formData: Record<string, any>) => {
    console.log("[AddNotesWizard] Wizard completion triggered");

    // Persist notes to Firebase
    await persistNotesToFirebase();

    // Call the parent completion handler
    if (onComplete) {
      onComplete(formData);
    }
  };

  // Set form values when editing a note
  const editNote = (index: number) => {
    const note = notes[index];

    // Reset form with the note's values
    form.reset({
      title: note.title,
      content: note.content,
      category: note.category,
      importance: note.importance || "medium",
    });

    setCurrentNoteIndex(index);
    setEditMode(true);
  };

  // Delete a note
  const deleteNote = (index: number) => {
    console.log(`[AddNotesWizard] Deleting note at index ${index}`);
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);
    setNotes(updatedNotes);
  };

  // Cancel editing
  const cancelEdit = () => {
    form.reset({
      title: "",
      content: "",
      category: "general",
      importance: "medium",
    });

    setCurrentNoteIndex(null);
    setEditMode(false);
  };

  // Add or update note
  function onSubmit(values: NoteFormValues) {
    console.log("[AddNotesWizard] Submitting note form:", values);

    const note: Note = {
      ...values,
      productId: product?.id,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    if (editMode && currentNoteIndex !== null) {
      // Update existing note
      const updatedNotes = [...notes];
      updatedNotes[currentNoteIndex] = {
        ...updatedNotes[currentNoteIndex],
        ...note,
        updatedAt: Date.now(),
      };

      setNotes(updatedNotes);
      cancelEdit();
    } else {
      // Add new note
      setNotes([...notes, note]);
      form.reset({
        title: "",
        content: "",
        category: "general",
        importance: "medium",
      });
    }
  }

  // Helper function to get importance badge color
  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "general":
        return "bg-blue-100 text-blue-800";
      case "technical":
        return "bg-purple-100 text-purple-800";
      case "business":
        return "bg-indigo-100 text-indigo-800";
      case "user-feedback":
        return "bg-green-100 text-green-800";
      case "improvement":
        return "bg-orange-100 text-orange-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <MiniWizardBase
      miniWizardId={MiniWizardId.ADD_NOTES}
      title="Add Notes"
      description="Add notes and thoughts about your product to help AI understand your ideas and considerations."
      xpReward={50}
      onBack={onBack}
      onComplete={handleWizardComplete}
    >
      <div className="space-y-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 border p-4 rounded-md"
          >
            <h3 className="text-lg font-medium">
              {editMode ? "Edit Note" : "Add New Note"}
            </h3>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter note title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for the note
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your note here"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed content of your note
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="user-feedback">
                          User Feedback
                        </SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="importance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Importance</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select importance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              {editMode && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!isFormValid}>
                {editMode ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Note
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Note
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notes ({notes.length})</h3>

          {notes.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">
                No notes added yet. Add your first note above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notes.map((note, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md">{note.title}</CardTitle>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editNote(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(note.category)}`}
                      >
                        {note.category.charAt(0).toUpperCase() +
                          note.category.slice(1).replace("-", " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getImportanceColor(note.importance)}`}
                      >
                        {(note.importance || "medium").charAt(0).toUpperCase() +
                          (note.importance || "medium").slice(1)}{" "}
                        Importance
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {note.content}
                    </p>
                  </CardContent>
                  <CardFooter className="text-xs text-gray-500 pt-0">
                    {note.updatedAt
                      ? `Updated: ${new Date(note.updatedAt).toLocaleString()}`
                      : `Created: ${new Date((note.createdAt || getCurrentUnixTimestamp()) * 1000).toLocaleString()}`}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MiniWizardBase>
  );
}
