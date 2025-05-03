import React from "react";
import { Main } from "@/components/layout/main";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonForm() {
  return (
    <Main>
      <div className="flex flex-col gap-4 animate-pulse p-6">
        <div className="h-8 w-2/3 bg-muted rounded"></div>
        <div className="h-4 w-1/2 bg-muted rounded"></div>
        <div className="h-32 w-full bg-muted rounded mt-4"></div>

        <div className="flex items-center justify-between mb-8 gap-4">
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
          <Skeleton className="h-16 w-full mb-4 bg-muted" />
        </div>
      </div>
    </Main>
  );
}
