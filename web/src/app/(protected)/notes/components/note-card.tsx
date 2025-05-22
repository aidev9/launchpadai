"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, StickyNote } from "lucide-react";
import { Note } from "./notes-store";
import { formatDistance } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onPhaseClick?: (phase: string) => void;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onPhaseClick,
}: NoteCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(note);
  };

  const handlePhaseClick = (e: React.MouseEvent, phase: string) => {
    e.stopPropagation();
    if (onPhaseClick) onPhaseClick(phase);
  };

  return (
    <Card
      className="p-4 hover:shadow-md hover:bg-accent transition-shadow relative group shadow-none rounded-md border border-primary/20 min-h-48"
      data-testid={`note-card-${note.id}`}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleEdit}
              data-testid={`edit-note-${note.id}`}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleDelete}
              data-testid={`delete-note-${note.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start mb-2 pr-10 border-b border-primary/20 pb-4">
        <StickyNote className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
        <div className="line-clamp-3 text-sm">{note.note_body}</div>
      </div>

      <div className="flex flex-wrap gap-1 mb-0 pt-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {note.phases?.map((phase) => (
            <Badge
              key={phase}
              className="cursor-pointer"
              variant="outline"
              onClick={(e) => handlePhaseClick(e, phase)}
            >
              {phase}
            </Badge>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Updated{" "}
          {formatDistance(
            new Date((note.updatedAt || note.createdAt || Date.now()) * 1000),
            new Date(),
            { addSuffix: true }
          )}
        </div>
      </div>
    </Card>
  );
}
