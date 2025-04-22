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
import { Plus } from "lucide-react";
import { useAtom } from "jotai";

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
        <div className="mb-6">
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
          <div className="flex items-center justify-between mt-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Answer Questions
            </h2>
            <AddQuestionButton />
          </div>
          <p className="text-muted-foreground">
            Respond to questions to help us generate assets for your startup.
          </p>
        </div>

        <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
          <QuestionWizard />
        </div>
      </Main>
    </Provider>
  );
}
