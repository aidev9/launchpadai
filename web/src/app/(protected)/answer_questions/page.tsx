"use client";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Provider } from "jotai";
import { questionModalOpenAtom } from "@/lib/store/questions-store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAtom } from "jotai";
import { NextStepsHorizontal } from "./next-steps-horizontal";
import { QuestionsReviewer } from "./components/questions-reviewer";
import { PhaseToolbar } from "./components/phase-toolbar";
import { QuestionWizard } from "./components/question-wizard";
import { AddQuestionButton } from "./components/add-question-button";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

// Client component for the button - REMOVED, we use the new AddQuestionButton component
// function AddQuestionButton() {
//   const [, setModalOpen] = useAtom(questionModalOpenAtom);
//
//   return (
//     <Button
//       variant="default"
//       size="sm"
//       className="flex items-center gap-1"
//       onClick={() => setModalOpen(true)}
//     >
//       <Plus className="h-4 w-4" />
//       Add Question
//     </Button>
//   );
// }

// Separate component to prevent rerenders of the entire page
function QuestionModalProvider() {
  return <QuestionWizard />;
}

export default function AnswerQuestions() {
  return (
    <Provider>
      {/* Modal is rendered at the top level but in a separate component */}
      <QuestionModalProvider />

      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown user={null} />
        </div>
      </Header>

      <Main className="py-24 px-4">
        <div className="mb-6 flex flex-col md:flex-row gap-6 justify-between">
          <div className="flex-1">
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
            <h2 className="text-2xl font-bold tracking-tight mt-4">
              Answer Questions
            </h2>
            <p className="text-muted-foreground">
              Respond to questions to help us generate assets for your startup.
            </p>

            <div className="mt-6">
              <PhaseToolbar />
            </div>
          </div>

          {/* Add Question Button */}
          <div className="flex items-start mt-6 md:mt-0">
            <AddQuestionButton />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-1 py-1 lg:space-y-0">
          <QuestionsReviewer />
          {/* Horizontal Next Steps Navigation at bottom */}
          <NextStepsHorizontal />
        </div>
      </Main>
    </Provider>
  );
}
