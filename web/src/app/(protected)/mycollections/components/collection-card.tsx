"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collection, CollectionStatus } from "@/lib/firebase/schema";
import { getPhaseColor } from "@/components/prompts/phase-filter";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tag: string) => void;
  onStatusClick?: (status: CollectionStatus) => void;
}

export function CollectionCard({
  collection,
  onClick,
  onEdit,
  onDelete,
  onTagClick,
  onStatusClick,
}: CollectionCardProps) {
  const getStatusColor = (status: CollectionStatus) => {
    switch (status) {
      case "indexing":
        return "bg-blue-100 text-blue-700";
      case "indexed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: CollectionStatus) => {
    switch (status) {
      case "uploading":
        return "Uploading";
      case "uploaded":
        return "Uploaded";
      case "indexing":
        return "Indexing";
      case "indexed":
        return "Indexed";
      case "reindexing":
        return "Reindexing";
      default:
        return status;
    }
  };

  const renderStatusBadge = (status: CollectionStatus) => {
    if (status === "indexing") {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick?.(status);
          }}
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Indexing
        </Badge>
      );
    } else if (status === "indexed") {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick?.(status);
          }}
        >
          Indexed
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-700 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick?.(status);
          }}
        >
          {getStatusLabel(status)}
        </Badge>
      );
    }
  };

  return (
    <Card
      className="p-4 hover:shadow-md hover:bg-accent transition-shadow cursor-pointer relative group shadow-none rounded-md border border-primary/20 min-h-48"
      onClick={onClick}
      data-testid="collection-card"
    >
      <CardHeader className="p-0 flex flex-row justify-between items-start">
        <div className="space-y-1 pr-8">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">
            {collection.title}
          </h3>
          <div className="flex items-center gap-2">
            {renderStatusBadge(collection.status)}
            <p className="text-xs text-muted-foreground">
              {collection.updatedAt
                ? `Updated ${formatDistanceToNow(
                    new Date(collection.updatedAt * 1000),
                    { addSuffix: true }
                  )}`
                : ""}
            </p>
          </div>
        </div>

        {/* Dropdown menu */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 cursor-pointer">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {collection.description || "No description"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
        {collection.phaseTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className={`${getPhaseColor(tag)} cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              onTagClick?.(tag);
            }}
          >
            {tag}
          </Badge>
        ))}
        {collection.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="bg-muted cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick?.(tag);
            }}
          >
            {tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
