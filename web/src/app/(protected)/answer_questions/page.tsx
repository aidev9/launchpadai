"use client";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Provider } from "jotai";
import {
  QuestionWizard,
  questionModalOpenAtom,
} from "./components/question-wizard";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, FileSearch, Download } from "lucide-react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

// Client component for the button
function AddQuestionButton() {
  const [, setModalOpen] = useAtom(questionModalOpenAtom);

  return (
    <Button
      variant="default"
      size="sm"
      className="flex items-center gap-1"
      onClick={() => setModalOpen(true)}
    >
      <Plus className="h-4 w-4" />
      Add Question
    </Button>
  );
}

// Next Steps Component
function NextSteps() {
  const router = useRouter();

  return (
    <Card className="w-full h-fit flex-shrink-0 rounded-lg border">
      <CardTitle className="text-base ml-6 mt-2 mb-0">Next Steps</CardTitle>

      <CardContent className="flex flex-col space-y-2 py-3">
        <div
          className="flex items-center justify-between py-1 px-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push("/review_assets")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
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
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        <div
          className="flex items-center justify-between py-1 px-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => router.push("/download_assets")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
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

export default function AnswerQuestions() {
  return (
    <Provider>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main>
        <div className="flex gap-6 justify-between">
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <Breadcrumbs
                items={[
                  { label: "Products", href: "/dashboard" },
                  { label: "Product", href: "/product" },
                  {
                    label: "Answer Questions",
                    href: "/answer_questions",
                    isCurrentPage: true,
                  },
                ]}
              />
              <h2 className="text-2xl font-bold tracking-tight">
                Answer Questions
              </h2>
              <p className="text-muted-foreground">
                Respond to questions to help us generate assets for your
                startup.
              </p>
            </div>
          </div>
          <div className="w-[30%]">
            <NextSteps />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
          <QuestionWizard />
        </div>
      </Main>
    </Provider>
  );
}
