"use client";
import { Main } from "@/components/layout/main";
import { columns } from "./components/qa-columns";
import { QADialogs } from "./components/qa-dialogs-with-mutations";
import { QAPrimaryButtons } from "./components/qa-primary-buttons";
import { QATable } from "./components/qa-table";
import { questionListSchema } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { toast as showToast } from "@/hooks/use-toast";
import { allQuestionsAtom } from "./components/qa-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { useQuestionsQuery } from "./hooks/useQuestionsQuery";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

export default function QA() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [allQuestions] = useAtom(allQuestionsAtom);

  // Use the Tanstack Query hook instead of manual fetch logic
  const { isLoading, isError, error, questionsQuery } =
    useQuestionsQuery(selectedProductId);

  // Handle errors from the query
  if (isError && error) {
    console.error("QA Page: Fetch error:", error);
    showToast({
      title: "Error loading questions",
      description:
        error instanceof Error ? error.message : "Failed to load questions",
      variant: "destructive",
      duration: TOAST_DEFAULT_DURATION,
    });
  }

  // Handler function using the extracted type
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
  };

  // Function to refresh questions after mutations
  const refreshQuestions = () => {
    // Invalidate and refetch the query
    if (selectedProductId) {
      questionsQuery.refetch();
    }
  };

  // Parse question list
  const questionList = questionListSchema.parse(
    Array.isArray(allQuestions) ? allQuestions : []
  );

  const breadcrumbItems = [{ label: "Q&A" }];

  return (
    <>
      <Main>
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Questions & Answers
            </h2>
            <p className="text-muted-foreground">
              Manage your questions and answers here.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <QAPrimaryButtons />
          </div>
        </div>
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading questions...</p>
            </div>
          ) : (
            <QATable data={questionList} columns={columns as any} />
          )}
        </div>
      </Main>

      <QADialogs onSuccess={refreshQuestions} onShowToast={showToastHandler} />
    </>
  );
}
