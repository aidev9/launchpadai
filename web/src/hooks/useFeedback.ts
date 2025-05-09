import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFeedback,
  getAllFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  respondToFeedback,
} from "@/lib/firebase/feedback";
import { FeedbackInput } from "@/lib/firebase/schema";
import { useToast } from "@/hooks/use-toast";
import { TOAST_DEFAULT_DURATION } from "@/utils/constants";

// Hook for fetching all feedback
export function useAllFeedback() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["feedback"],
    queryFn: async () => {
      const result = await getAllFeedback();
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to load feedback",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        return [];
      }
      return result.feedback || [];
    },
  });
}

// Hook for fetching a single feedback item
export function useFeedbackItem(id: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["feedback", id],
    queryFn: async () => {
      const result = await getFeedback(id);
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to load feedback item",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
        return null;
      }
      return result.feedback;
    },
    enabled: !!id,
  });
}

// Hook for creating feedback
export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      data,
      userId,
      userEmail,
    }: {
      data: FeedbackInput;
      userId: string;
      userEmail: string;
    }) => {
      return await createFeedback(data, userId, userEmail);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["feedback"] });
        toast({
          title: "Feedback submitted",
          description: "Thank you for your feedback!",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit feedback",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
      return result;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}

// Hook for updating feedback
export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FeedbackInput>;
    }) => {
      return await updateFeedback(id, data);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["feedback"] });
        queryClient.invalidateQueries({ queryKey: ["feedback", variables.id] });
        toast({
          title: "Feedback updated",
          description: "The feedback has been updated successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update feedback",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
      return result;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}

// Hook for responding to feedback
export function useRespondToFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      return await respondToFeedback(id, response);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["feedback"] });
        queryClient.invalidateQueries({ queryKey: ["feedback", variables.id] });
        toast({
          title: "Response sent",
          description: "Your response has been sent successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send response",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
      return result;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}

// Hook for deleting feedback
export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteFeedback(id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["feedback"] });
        toast({
          title: "Feedback deleted",
          description: "The feedback has been deleted successfully",
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete feedback",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
      return result;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}

// Hook for bulk deleting feedback
export function useBulkDeleteFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(ids.map((id) => deleteFeedback(id)));
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      return {
        success: successCount > 0,
        successCount,
        failCount,
        error:
          failCount > 0 ? `Failed to delete ${failCount} items` : undefined,
      };
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["feedback"] });
        toast({
          title: "Feedback deleted",
          description: `Successfully deleted ${result.successCount} items${
            result.failCount > 0
              ? `. Failed to delete ${result.failCount} items.`
              : ""
          }`,
          duration: TOAST_DEFAULT_DURATION,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete feedback",
          variant: "destructive",
          duration: TOAST_DEFAULT_DURATION,
        });
      }
      return result;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: TOAST_DEFAULT_DURATION,
      });
    },
  });
}
