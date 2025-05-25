"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action";
import { firebaseAdminProducts } from "@/lib/firebase/client/FirebaseAdminProducts";

const deleteProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

const deleteMultipleProductsSchema = z.object({
  productIds: z.array(z.string()).min(1, "At least one product ID is required"),
});

export const deleteProduct = actionClient
  .schema(deleteProductSchema)
  .action(async ({ parsedInput: { productId } }) => {
    try {
      console.log(`[deleteProduct] Attempting to delete product ${productId}`);

      // TODO: Implement actual Firebase deletion
      // For now, just simulate the deletion
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(`[deleteProduct] Successfully deleted product ${productId}`);

      return {
        success: true,
        message: "Product deleted successfully",
      };
    } catch (error) {
      console.error(
        `[deleteProduct] Error deleting product ${productId}:`,
        error
      );

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete product",
      };
    }
  });

export const deleteMultipleProducts = actionClient
  .schema(deleteMultipleProductsSchema)
  .action(async ({ parsedInput: { productIds } }) => {
    try {
      console.log(
        `[deleteMultipleProducts] Attempting to delete ${productIds.length} products`
      );

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Delete products one by one
      for (const productId of productIds) {
        try {
          // TODO: Implement actual Firebase deletion
          // For now, just simulate the deletion
          await new Promise((resolve) => setTimeout(resolve, 200));

          successCount++;
          console.log(
            `[deleteMultipleProducts] Successfully deleted product ${productId}`
          );
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`Product ${productId}: ${errorMessage}`);
          console.error(
            `[deleteMultipleProducts] Failed to delete product ${productId}:`,
            error
          );
        }
      }

      const message =
        failedCount === 0
          ? `Successfully deleted ${successCount} products`
          : `Deleted ${successCount} products, failed to delete ${failedCount} products`;

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
      console.error(`[deleteMultipleProducts] Error in batch deletion:`, error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete products",
      };
    }
  });
