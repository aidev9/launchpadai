"use client";

import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Download,
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
          onClick={() => router.push("/answer_questions")}
          className="absolute left-4 max-w-[40%] flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-background"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 ml-3 truncate">
            <p className="font-medium text-sm md:text-base truncate">
              Answer Questions
            </p>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              Get AI-powered insights
            </p>
          </div>
        </div>

        {/* Right button - positioned to the right edge */}
        <div
          onClick={() => router.push("/download_assets")}
          className="absolute right-4 max-w-[40%] flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer bg-background"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0 truncate">
              <p className="font-medium text-sm md:text-base truncate">
                Download Assets
              </p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Get all files and documents
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
