import { MouseEvent, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prompt } from "@/lib/firebase/schema";
import { getPhaseColor } from "./phase-filter";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Maximize,
  Download,
  XCircle,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { IconPlaylistAdd } from "@tabler/icons-react";

interface PromptCardProps {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onTagClick?: (tag: string) => void;
  onExpand?: (prompt: Prompt) => void;
  onUseAsTemplate?: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  onClick,
  onEdit,
  onDelete,
  onTagClick,
  onUseAsTemplate,
}: PromptCardProps) {
  const [expandedPrompt, setExpandedPrompt] = useState<Prompt | null>(null);

  // Listen for Escape key to close expanded prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedPrompt) {
        setExpandedPrompt(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedPrompt]);

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
    setExpandedPrompt(prompt);
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

  // Handle use as template menu item click
  const handleUseAsTemplateClick = (e: MouseEvent) => {
    e.stopPropagation();
    onUseAsTemplate?.(prompt);
  };

  return (
    <Card
      className="p-4 hover:shadow-md hover:bg-accent transition-shadow cursor-pointer relative group shadow-none rounded-md border border-primary/20 min-h-48"
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
            {onUseAsTemplate && (
              <DropdownMenuItem onClick={handleUseAsTemplateClick}>
                Use as Template
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expand button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleExpandClick}
        title="Expand"
      >
        <Maximize className="h-4 w-4" />
      </Button>

      {/* Expanded prompt overlay */}
      {expandedPrompt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedPrompt(null)}
        >
          <div
            className="bg-background rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{prompt.title}</h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(prompt.body);
                    toast({
                      title: "Copied!",
                      description: "Prompt copied to clipboard",
                      duration: 2000,
                    });
                  }}
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const blob = new Blob([prompt.body], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${prompt.title.replace(/\s+/g, "-")}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  title="Download as text file"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedPrompt(null)}
                  title="Close"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {expandedPrompt.phaseTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={getPhaseColor(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="whitespace-pre-wrap">{expandedPrompt.body}</div>
          </div>
        </div>
      )}

      <div className="flex items-start mb-2 pr-10">
        <IconPlaylistAdd className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
        <h3 className="font-semibold text-md leading-tight line-clamp-1">
          {prompt.title}
        </h3>
      </div>

      <p className="text-muted-foreground text-sm line-clamp-4 mb-4">
        {prompt.body}
      </p>
      <div className="flex flex-wrap gap-1 mb-0">
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
    </Card>
  );
}
