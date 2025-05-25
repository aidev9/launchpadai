"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function QACardSkeleton() {
  return (
    <Card className="p-4 shadow-none rounded-md border border-primary/20 min-h-48">
      {/* Header with title */}
      <div className="flex items-start mb-2 pr-10 border-b border-primary/20 pb-4">
        <Skeleton className="h-5 w-3/4" />
      </div>

      {/* Answer */}
      <div className="py-2 flex-grow">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      {/* Footer with tags */}
      <div className="flex flex-wrap gap-1 mb-0 pt-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}

export function QAGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <QACardSkeleton key={i} />
      ))}
    </div>
  );
}

export function QATableSkeleton() {
  return (
    <div className="border rounded-md">
      <div className="p-4 space-y-4">
        {/* Table header */}
        <div className="flex items-center space-x-4 pb-2 border-b">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>

        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
