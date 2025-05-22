"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Product } from "@/lib/firebase/schema";
import { getPhaseColor } from "./phase-filter";
import { formatDistance } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconCube } from "@tabler/icons-react";

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onPhaseClick?: (phase: string) => void;
}

export function ProductCard({
  product,
  onClick,
  onEdit,
  onDelete,
  onPhaseClick,
}: ProductCardProps) {
  const handleClick = () => {
    if (onClick) onClick(product);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(product);
  };

  const handlePhaseClick = (e: React.MouseEvent, phase: string) => {
    e.stopPropagation();
    if (onPhaseClick) onPhaseClick(phase);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(product);
  };

  return (
    <Card
      className="p-4 hover:shadow-md hover:bg-accent transition-shadow cursor-pointer relative group shadow-none rounded-md border border-primary/20 min-h-48"
      onClick={handleClick}
      data-testid={`product-card-${product.id}`}
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
              onClick={handleView}
              data-testid={`view-product-${product.id}`}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleEdit}
              data-testid={`edit-product-${product.id}`}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleDelete}
              data-testid={`delete-product-${product.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-start mb-2 pr-10 border-b border-primary/20 pb-4">
        <IconCube className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
        <h3 className="font-semibold text-md leading-tight line-clamp-1">
          {product.name}
        </h3>
      </div>

      <div className="py-2 flex-grow">
        <div className="line-clamp-3 text-muted-foreground text-sm">
          {product.description || "No description provided"}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-0 pt-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge
            className={`cursor-pointer ${getPhaseColor(product.phases?.[0] || "Discover")}`}
            variant="outline"
            onClick={(e) =>
              handlePhaseClick(e, product.phases?.[0] || "Discover")
            }
          >
            {product.phases?.[0] || "Discover"}
          </Badge>

          {product.website && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 p-0 text-xs text-muted-foreground"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={product.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Website</span>
              </a>
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Updated{" "}
          {formatDistance(
            new Date(product.updatedAt || product.createdAt || Date.now()),
            new Date(),
            { addSuffix: true }
          )}
        </div>
      </div>
    </Card>
  );
}
