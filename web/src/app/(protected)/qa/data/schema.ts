import { z } from "zod";

const dateOrString = z.union([
  z.date(),
  z.string().transform((str) => new Date(str)),
]);

const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().nullable().optional(),
  phase: z.string().optional(),
  tags: z.array(z.string()).default([]),
  last_modified: dateOrString.optional(),
  createdAt: dateOrString.optional(),
  order: z.number().optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const questionListSchema = z.array(questionSchema);
