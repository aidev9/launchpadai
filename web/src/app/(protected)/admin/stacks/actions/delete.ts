"use server";

import { actionClient } from "@/lib/action";
import { z } from "zod";
import { deleteEntity } from "../../actions/admin-actions";
import { revalidatePath } from "next/cache";

// Schema for deleting a single stack
const deleteStackSchema = z.object({
  stackId: z.string().min(1, "Stack ID is required"),
});

// Schema for deleting multiple stacks
const deleteMultipleStacksSchema = z.object({
  stackIds: z.array(z.string()).min(1, "At least one stack ID is required"),
});

/**
 * Delete a single stack
 */
export const deleteStack = actionClient
  .schema(deleteStackSchema)
  .action(async ({ parsedInput: { stackId } }) => {
    try {
      console.log(`[deleteStack] Attempting to delete stack ${stackId}`);

      const result = await deleteEntity("mystacks", stackId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete stack");
      }

      // Revalidate the admin page to refresh the data
      revalidatePath("/admin");

      console.log(`[deleteStack] Successfully deleted stack ${stackId}`);

      return {
        success: true,
        message: "Stack deleted successfully",
      };
    } catch (error) {
      console.error(`[deleteStack] Error deleting stack ${stackId}:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete stack",
      };
    }
  });

/**
 * Delete multiple stacks
 */
export const deleteMultipleStacks = actionClient
  .schema(deleteMultipleStacksSchema)
  .action(async ({ parsedInput: { stackIds } }) => {
    try {
      console.log(
        `[deleteMultipleStacks] Attempting to delete ${stackIds.length} stacks`
      );

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Delete stacks one by one
      for (const stackId of stackIds) {
        try {
          const result = await deleteEntity("mystacks", stackId);

          if (!result.success) {
            throw new Error(result.error || "Failed to delete stack");
          }

          successCount++;
          console.log(
            `[deleteMultipleStacks] Successfully deleted stack ${stackId}`
          );
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`Stack ${stackId}: ${errorMessage}`);
          console.error(
            `[deleteMultipleStacks] Failed to delete stack ${stackId}:`,
            error
          );
        }
      }

      // Revalidate the admin page to refresh the data
      revalidatePath("/admin");

      const message =
        failedCount === 0
          ? `Successfully deleted ${successCount} stacks`
          : `Deleted ${successCount} stacks, failed to delete ${failedCount} stacks`;

      return {
        success: failedCount === 0,
        message,
        details: {
          successCount,
          failedCount,
          errors,
        },
      };
    } catch (error) {
      console.error(`[deleteMultipleStacks] Error in batch deletion:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete stacks",
      };
    }
  });
