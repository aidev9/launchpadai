import { z } from "zod";

const questionSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  question: z.string(),
  answer: z.string().nullable().optional(),
  tags: z.array(z.string()),
  last_modified: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type Question = z.infer<typeof questionSchema>;

export const questionListSchema = z.array(questionSchema);
