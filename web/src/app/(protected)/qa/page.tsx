"use client";
import { Main } from "@/components/layout/main";
import { columns } from "./components/qa-columns";
import { QADialogs } from "./components/qa-dialogs";
import { QAPrimaryButtons } from "./components/qa-primary-buttons";
import { QATable } from "./components/qa-table";
import { Question, Phases } from "@/lib/firebase/schema";
import { useAtom } from "jotai";
import { selectedProductAtom } from "@/lib/store/product-store";
import { toast as showToast } from "@/hooks/use-toast";
import {
  questionsPhaseFilterAtom,
  viewModeAtom,
  searchQueryAtom,
  addQAModalOpenAtom,
} from "./components/qa-store";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";
import { FilterBar } from "@/components/ui/components/filter-bar";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { firebaseQA } from "@/lib/firebase/client/FirebaseQA";
import { QAGrid } from "./components/qa-grid";
import { PlusIcon } from "lucide-react";
import { QAGridSkeleton, QATableSkeleton } from "./components/qa-skeleton";

// Extract the options type directly from the imported toast function
type ShowToastOptions = Parameters<typeof showToast>[0];

export default function QA() {
  const [selectedProduct] = useAtom(selectedProductAtom);
  const [phaseFilter] = useAtom(questionsPhaseFilterAtom);
  const [searchQuery] = useAtom(searchQueryAtom);
  const [viewMode] = useAtom(viewModeAtom);
  const [addModalOpen, setAddModalOpen] = useAtom(addQAModalOpenAtom);

  // Use react-firebase-hooks to get questions for the current product
  const [questionData, isLoading, firestoreError] = useCollectionData(
    selectedProduct
      ? firebaseQA.getQuestionsByProduct(selectedProduct?.id)
      : phaseFilter.length > 0
        ? firebaseQA.getQuestionsByPhase(phaseFilter as Phases[])
        : firebaseQA.getQuestions(),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Format the data to include document ID and apply typing
  const formattedQuestions = (questionData || []).map((q) => {
    return {
      ...q,
      id: q.id,
    } as Question;
  });

  // Apply client-side search filter
  const filteredQuestions =
    searchQuery.trim() === ""
      ? formattedQuestions
      : formattedQuestions.filter((q) => {
          const query = searchQuery.toLowerCase();
          return (
            q.question?.toLowerCase().includes(query) ||
            q.answer?.toLowerCase().includes(query) ||
            q.tags?.some((tag) => tag.toLowerCase().includes(query))
          );
        });

  // Handler function for toast notifications
  const showToastHandler = (options: ShowToastOptions) => {
    showToast(options);
  };

  const breadcrumbItems = [{ label: "Q&A" }];

  // Handle Firebase errors
  if (firestoreError) {
    return (
      <Main>
        <ErrorDisplay
          error={firestoreError}
          title="Q&A rockets are offline!"
          message="Our question loading system hit some space debris. Mission control is working on it!"
          onRetry={() => window.location.reload()}
          retryText="Retry Launch"
          component="QA"
          action="loading_questions"
          metadata={{
            productId: selectedProduct?.id,
            phaseFilter,
            searchQuery,
          }}
        />
      </Main>
    );
  }

  return (
    <>
      <Main>
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />
        <div className="mb-6 flex flex-row md:flex-row gap-6 justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              Questions & Answers
            </h2>
            <p className="text-muted-foreground">
              Manage your questions and answers here.
            </p>
          </div>

          <QAPrimaryButtons />
        </div>

        {/* Filter Bar component */}
        <div className="mb-6">
          <FilterBar
            mode="questions" // reusing the prompts mode since we need same functionality
            placeholderText="Filter questions..."
            data-testid="qa-filter-bar"
          />
        </div>

        <div className="flex-1">
          {isLoading ? (
            viewMode === "grid" ? (
              <QAGridSkeleton />
            ) : (
              <QATableSkeleton />
            )
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground">No questions found.</p>
              <button
                className="mt-4 px-4 py-2 bg-primary text-white rounded flex items-center"
                onClick={() => {
                  setAddModalOpen(true);
                }}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Question
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <QAGrid questions={filteredQuestions} />
          ) : (
            <QATable data={filteredQuestions} columns={columns as any} />
          )}
        </div>
      </Main>

      <QADialogs onSuccess={() => {}} onShowToast={showToastHandler} />
    </>
  );
}
