"use client";

import Link from "next/link";
// import { usePathname } from "next/navigation";
import {
  // Breadcrumb,
  BreadcrumbItem,
  // BreadcrumbLink,
  // BreadcrumbList,
  // BreadcrumbPage,
  // BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  // productName?: string;
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
  className,
  // productName,
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-sm text-muted-foreground",
        className
      )}
    >
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {item.href && !item.isCurrentPage && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
