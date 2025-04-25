"use client";

import { useRouter } from "next/navigation";
import { FileSearch, ChevronRight, ChevronLeft } from "lucide-react";
import { IconCube } from "@tabler/icons-react";

export function NextStepsHorizontal() {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-[var(--sidebar-width,0px)] right-0 bg-sidebar border-t rounded-tl-lg py-4 w-[calc(100%-var(--sidebar-width,0px))]">
      <div className="relative mx-auto px-4">
        {/* Review Assets button */}
        <div
          onClick={() => router.push("/product")}
          className="absolute left-4 max-w-[40%] flex items-center p-3 pr-6 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-background"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900">
            <IconCube className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="min-w-0 ml-3 truncate">
            <p className="font-medium text-sm md:text-base truncate">
              Back to Product
            </p>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              Review product details
            </p>
          </div>
        </div>

        {/* Download Assets button */}
        <div
          onClick={() => router.push("/review_assets")}
          className="absolute right-4 max-w-[40%] flex items-center justify-between p-3 pl-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-background"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <FileSearch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm md:text-base truncate">
                Review Assets
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Browse product materials
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
