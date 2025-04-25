"use client";
import { Main } from "@/components/layout/main";
import { columns } from "./components/qa-columns";
import { QADialogs } from "./components/qa-dialogs";
import { QAPrimaryButtons } from "./components/qa-primary-buttons";
import { QATable } from "./components/qa-table";
import { questionListSchema } from "./data/schema";
import { useEffect, useState, useCallback } from "react";
import { useAtom } from "jotai";
import { selectedProductIdAtom } from "@/lib/store/product-store";
import { getOrderedProductQuestions } from "@/lib/firebase/actions/questions";
import { toast as showToast } from "@/hooks/use-toast";
import { allQuestionsAtom } from "./components/qa-store";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

export default function QA() {
  const [selectedProductId] = useAtom(selectedProductIdAtom);
  const [allQuestions, setAllQuestions] = useAtom(allQuestionsAtom);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load questions that can be called when needed
  const loadQuestions = useCallback(
    async (skipLoadingState = false) => {
      if (!selectedProductId) {
        console.log("No product ID selected, cannot load questions.");
        setIsLoading(false);
        return;
      }

      // Only set loading if not skipping loading state
      if (!skipLoadingState) {
        setIsLoading(true);
      }

      try {
        console.log(
          "QA Page: Fetching questions for product",
          selectedProductId
        );
        const response = await getOrderedProductQuestions(selectedProductId);

        if (response.success && response.questions) {
          console.log(
            "QA Page: Fetch success, questions count:",
            response.questions.length
          );
          setAllQuestions(
            response.questions.map((q: any) => ({
              id: q.id,
              question: q.question ?? "",
              tags: q.tags ?? [],
              answer: q.answer ?? null,
              phase: q.phase,
              last_modified: q.last_modified
                ? new Date(q.last_modified)
                : undefined,
              createdAt: q.createdAt ? new Date(q.createdAt) : undefined,
              order: q.order,
            }))
          );
        } else {
          console.error("QA Page: Fetch error:", response.error);
          showToast({
            title: "Error loading questions",
            description: response.error || "Failed to load questions",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("QA Page: Failed to fetch questions:", error);
        showToast({
          title: "Error loading questions",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        // Only update loading state if we were showing loading
        if (!skipLoadingState) {
          setIsLoading(false);
        }
      }
    },
    [selectedProductId, setAllQuestions]
  );

  // Load questions on component mount or when selectedProductId changes
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Handler function using the extracted type
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
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
        <>
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
              <QATable data={questionList} columns={columns} />
            )}
          </div>
        </>
      </Main>

      <QADialogs
        onSuccess={() => loadQuestions(true)}
        onShowToast={showToastHandler}
      />
    </>
  );
}
