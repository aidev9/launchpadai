"use client";

import { useState } from "react";
import { Feature } from "@/lib/firebase/schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface FeatureGridProps {
  features: Feature[];
  onViewFeature: (feature: Feature) => void;
  onEditFeature: (feature: Feature) => void;
  onDeleteFeature: (feature: Feature) => void;
}

export function FeatureGrid({
  features,
  onViewFeature,
  onEditFeature,
  onDeleteFeature,
}: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.length === 0 ? (
        <div className="col-span-full flex justify-center items-center h-32 text-muted-foreground">
          No features found.
        </div>
      ) : (
        features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onView={() => onViewFeature(feature)}
            onEdit={() => onEditFeature(feature)}
            onDelete={() => onDeleteFeature(feature)}
          />
        ))
      )}
    </div>
  );
}

interface FeatureCardProps {
  feature: Feature;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function FeatureCard({ feature, onView, onEdit, onDelete }: FeatureCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Under Development":
        return "bg-blue-100 text-blue-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onView}
    >
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {feature.name}
          </CardTitle>
          <div className="mt-1">
            <Badge className={getStatusColor(feature.status)}>
              {feature.status}
            </Badge>
          </div>
        </div>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsMenuOpen(false);
              }}
              className="text-red-600 hover:!text-red-600 hover:!bg-red-50 focus:!text-red-600 focus:!bg-red-50"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {feature.description || "No description provided."}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
        {feature.tags && feature.tags.length > 0 ? (
          feature.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
        {feature.tags && feature.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{feature.tags.length - 3}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
