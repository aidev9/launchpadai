import * as z from "zod";

// Form schema for wizard collections
export const collectionSchema = z.object({
  title: z.string().min(2, {
    message: "Collection title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Collection description must be at least 10 characters.",
  }),
  phaseTags: z.array(z.string()),
  tags: z.array(z.string()),
});

// Form schema for wizard documents
export const documentSchema = z.object({
  title: z.string().min(2, {
    message: "Document title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Document description must be at least 10 characters.",
  }),
  tags: z.array(z.string()),
  chunkSize: z.number().min(100).max(10000),
  overlap: z.number().min(0).max(5000),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;
export type DocumentFormValues = z.infer<typeof documentSchema>;
