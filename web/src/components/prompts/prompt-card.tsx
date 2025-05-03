import { MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prompt } from "@/lib/firebase/schema";
import { getPhaseColor } from "./phase-filter";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Maximize } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PromptCardProps {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onTagClick?: (tag: string) => void;
  onExpand?: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  onClick,
  onEdit,
  onDelete,
  onTagClick,
  onExpand,
}: PromptCardProps) {
  // Prevent event bubbling for menu actions
  const handleMenuClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  // Handle tag click
  const handleTagClick = (e: MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagClick?.(tag);
  };

  // Handle expand button click
  const handleExpandClick = (e: MouseEvent) => {
    e.stopPropagation();
    onExpand?.(prompt);
  };

  // Handle edit menu item click
  const handleEditClick = (e: MouseEvent) => {
    e.stopPropagation();
    onEdit?.(prompt);
  };

  // Handle delete menu item click
  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete?.(prompt);
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
      onClick={() => onClick(prompt)}
    >
      {/* Dropdown menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={handleMenuClick}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={handleEditClick}>
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-red-500"
                onClick={handleDeleteClick}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expand button */}
      {onExpand && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleExpandClick}
          title="Expand"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      )}

      <h3 className="font-semibold text-lg mb-2 line-clamp-1 pr-6">
        {prompt.title}
      </h3>

      <div className="flex flex-wrap gap-1 mb-2">
        {prompt.phaseTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className={`${getPhaseColor(tag)} ${onTagClick ? "cursor-pointer" : ""}`}
            onClick={onTagClick ? (e) => handleTagClick(e, tag) : undefined}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <p className="text-muted-foreground text-sm line-clamp-4">
        {prompt.body}
      </p>
    </Card>
  );
}
