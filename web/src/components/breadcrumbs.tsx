"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  items?: {
    label: string;
    href: string;
    isCurrentPage?: boolean;
  }[];
  homePath?: string;
  homeLabel?: string;
  showHome?: boolean;
}

/**
 * A reusable breadcrumbs component that shows the navigation hierarchy.
 *
 * Usage:
 * ```tsx
 * // Basic usage with auto-detection of current page
 * <Breadcrumbs />
 *
 * // With custom items
 * <Breadcrumbs
 *   items={[
 *     { label: "Dashboard", href: "/dashboard" },
 *     { label: "Products", href: "/products" },
 *     { label: "Product Name", href: "/product/123", isCurrentPage: true },
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  homePath = "/dashboard",
  homeLabel = "Home",
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // If no items are provided, use the current path to generate breadcrumbs
  if (!items) {
    const pathSegments = pathname
      .split("/")
      .filter((segment) => segment !== "");

    // Generate breadcrumbs from path segments
    const breadcrumbItems = pathSegments.map((segment, index) => {
      const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
      const isCurrentPage = index === pathSegments.length - 1;

      // Format the label (capitalize and replace hyphens with spaces)
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        label,
        href,
        isCurrentPage,
      };
    });

    items = breadcrumbItems;
  }

  // Only show home if there are items or showHome is explicitly true
  const shouldShowHome =
    showHome && (items.length > 0 || pathname !== homePath);

  // Create a combined array of items and separators in the correct order
  const breadcrumbElements = [];

  // Add home item if needed
  if (shouldShowHome) {
    breadcrumbElements.push(
      <BreadcrumbItem key="home">
        <BreadcrumbLink asChild>
          <Link href={homePath} className="flex items-center">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only md:not-sr-only md:ml-2">{homeLabel}</span>
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );

    // Add separator after home if there are items
    if (items.length > 0) {
      breadcrumbElements.push(
        <BreadcrumbSeparator key="home-separator">
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
      );
    }
  }

  // Add all items and separators
  items.forEach((item, index) => {
    // Add separator before item (except for first item which already has a separator if home is shown)
    if (index > 0) {
      breadcrumbElements.push(
        <BreadcrumbSeparator key={`separator-${index}`}>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
      );
    }

    // Add the item
    breadcrumbElements.push(
      <BreadcrumbItem key={`item-${index}`}>
        {item.isCurrentPage ? (
          <BreadcrumbPage>{item.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={item.href}>{item.label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    );
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbElements}</BreadcrumbList>
    </Breadcrumb>
  );
}
