"use client";
import { Main } from "@/components/layout/main";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NextStepsHorizontal } from "./next-steps-horizontal";
import { QuestionsReviewer } from "./components/questions-reviewer";
import { PhaseToolbar } from "./components/phase-toolbar";
import { QuestionWizard } from "./components/question-wizard";
import { AddQuestionButton } from "./components/add-question-button";
import { toast as showToast } from "@/hooks/use-toast";
import React, { useCallback } from "react";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

const QuestionModalProvider = React.memo(
  ({ onShowToast }: { onShowToast: (options: ShowToastOptions) => void }) => {
    // Pass the handler down to the wizard
    return <QuestionWizard onShowToast={onShowToast} />;
  }
);

// Add display name for debugging
QuestionModalProvider.displayName = "QuestionModalProvider";

export default function AnswerQuestions() {
  // Handler function to call the imported toast - memoized with useCallback
  const showToastHandler = useCallback((options: ShowToastOptions) => {
    showToast(options);
  }, []);

  return (
    <>
      {/* Pass the handler to the modal provider */}
      <QuestionModalProvider onShowToast={showToastHandler} />

      <Main>
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
          {/* Pass the handler to the reviewer */}
          <QuestionsReviewer onShowToast={showToastHandler} />
          {/* Horizontal Next Steps Navigation at bottom */}
          <NextStepsHorizontal />
        </div>
      </Main>
    </>
  );
}
