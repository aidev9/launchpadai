"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Download,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export function NextStepsCard() {
  const router = useRouter();

  return (
    <Card className="w-full md:w-[30%] h-fit flex-shrink-0">
      <CardHeader className="pb-2">
        <CardTitle>Navigation</CardTitle>
        <p className="text-muted-foreground text-sm">
          Continue building your product
        </p>
      </CardHeader>
      <CardContent className="flex flex-col space-y-3">
        <div
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push("/answer_questions")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm md:text-base truncate">
                Answer Questions
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Get AI-powered insights
              </p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </div>

        <div
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push("/download_assets")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm md:text-base truncate">
                Download Assets
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Get all files and documents
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}
