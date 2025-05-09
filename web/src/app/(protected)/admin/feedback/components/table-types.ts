import { Feedback } from "@/lib/firebase/schema";
import { TableMeta } from "@tanstack/react-table";

// Extend the TableMeta type to include our custom properties
export interface FeedbackTableMeta extends TableMeta<Feedback> {
  onRespond: (feedback: Feedback) => void;
}
