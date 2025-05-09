import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrderedProductQuestions,
  updateProductQuestionAction,
  addProductQuestionAction,
  deleteQuestionAction,
} from "@/lib/firebase/actions/questions";
import { useAtom } from "jotai";
import { allQuestionsAtom } from "../components/qa-store";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { Question } from "@/lib/firebase/schema";

// Query key factory
export const questionsKeys = {
  all: ["questions"] as const,
  byProduct: (productId: string) => [...questionsKeys.all, productId] as const,
};

export function useQuestionsQuery(productId: string | null) {
  const [, setAllQuestions] = useAtom(allQuestionsAtom);
  const queryClient = useQueryClient();

  // Main query to fetch questions data
  const questionsQuery = useQuery({
    queryKey: productId
      ? questionsKeys.byProduct(productId)
      : questionsKeys.all,
    queryFn: async () => {
      if (!productId) {
        return {
          success: false,
          questions: [],
          error: "No product ID selected",
        };
      }

      console.log("Fetching questions for product", productId);
      const response = await getOrderedProductQuestions(productId);

      // Update the atom with the fetched data
      if (response.success && response.questions) {
        const formattedQuestions = response.questions.map((q: any) => ({
          id: q.id,
          question: q.question ?? "",
          tags: q.tags ?? [],
          answer: q.answer ?? null,
          phases: q.phases ?? [q.phase ?? "Discover"],
          updatedAt: q.updatedAt || getCurrentUnixTimestamp(), // Use Firestore timestamp if available
          createdAt: q.createdAt || undefined, // Use Firestore timestamp if available
          order: q.order,
        }));

        setAllQuestions(formattedQuestions);
      }

      return response;
    },
    enabled: !!productId,
    // Disable for fetch on component mount - we'll wait for productId to be available
    // Will refetch when productId changes
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (
      questionData: Omit<Question, "id"> & { productId: string }
    ) => {
      const { productId, ...questionDetails } = questionData;
      // Ensure tags is always an array, never undefined
      const tags = questionDetails.tags || [];
      return await addProductQuestionAction(productId, {
        question: questionDetails.question || "",
        answer: questionDetails.answer || null,
        tags,
        phases: questionDetails.phases,
        phase:
          questionDetails.phases && questionDetails.phases.length > 0
            ? questionDetails.phases[0]
            : "Discover",
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate the questions query to refetch data
      queryClient.invalidateQueries({
        queryKey: questionsKeys.byProduct(variables.productId),
      });
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({
      productId,
      questionId,
      questionData,
    }: {
      productId: string;
      questionId: string;
      questionData: Partial<Question>;
    }) => {
      // Ensure we meet the required shape for updateProductQuestionAction
      return await updateProductQuestionAction(productId, questionId, {
        question: questionData.question || "",
        answer: questionData.answer || null,
        tags: questionData.tags || [],
        phases: questionData.phases,
        phase:
          questionData.phases && questionData.phases.length > 0
            ? questionData.phases[0]
            : "Discover",
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate the questions query to refetch data
      queryClient.invalidateQueries({
        queryKey: questionsKeys.byProduct(variables.productId),
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async ({
      productId,
      questionId,
    }: {
      productId: string;
      questionId: string;
    }) => {
      return await deleteQuestionAction(productId, questionId);
    },
    onSuccess: (_, variables) => {
      // Invalidate the questions query to refetch data
      queryClient.invalidateQueries({
        queryKey: questionsKeys.byProduct(variables.productId),
      });
    },
  });

  return {
    questionsQuery,
    addQuestionMutation,
    updateQuestionMutation,
    deleteQuestionMutation,
    // Export query state directly for convenience
    isLoading: questionsQuery.isLoading,
    isError: questionsQuery.isError,
    error: questionsQuery.error,
    data: questionsQuery.data,
    questions: questionsQuery.data?.questions || [],
  };
}
