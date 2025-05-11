export async function createFeature(data: z.infer<typeof featureInputSchema>) {
try {
// Validate input data
const validatedData = featureInputSchema.parse(data);
const userId = await getCurrentUserId();
const featuresRef = getUserProductFeaturesRef(userId, data.productId);

    // Check for unique name within product
    const existingFeatures = await featuresRef
      .where("name", "==", data.name)
      .get();

    if (!existingFeatures.empty) {
      return {
        success: false,
        error: "A feature with this name already exists for this product",
      };
    }

    // Add timestamps
    const timestamp = getCurrentUnixTimestamp();
    const featureData = {
      ...validatedData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

} catch (error) {
return {
success: false,
error: error instanceof Error ? error.message : "An error occurred",
};
}
}
