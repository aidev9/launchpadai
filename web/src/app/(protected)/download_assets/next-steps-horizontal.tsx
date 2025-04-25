"use client";

import { useRouter } from "next/navigation";
import {
  // MessageSquare,
  FileSearch,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export function NextStepsHorizontal() {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-[var(--sidebar-width,0px)] right-0 bg-sidebar border-t rounded-tl-lg py-4 w-[calc(100%-var(--sidebar-width,0px))]">
      <div className="relative mx-auto px-4">
        {/* Left button - positioned to match content area */}
        <div
          onClick={() => router.push("/review_assets")}
          className="absolute left-4 max-w-[40%] flex items-center p-3 pr-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-background"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <FileSearch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 truncate">
              <p className="font-medium text-sm md:text-base truncate">
                Review Assets
              </p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Browse product materials
              </p>
            </div>
          </div>
        </div>

        {/* Right button - positioned to the right edge */}
        <div
          onClick={() => router.push("/instructions")}
          className="absolute right-4 max-w-[40%] flex items-center justify-between p-3 pl-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-background"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <FileSearch className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 truncate">
              <p className="font-medium text-sm md:text-base truncate">
                Setup Instructions
              </p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Apply the generated assets
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      </div>

      {/* Invisible spacer to maintain proper height */}
      <div className="h-14"></div>
    </div>
  );
}
