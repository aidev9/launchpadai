import { Bug, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackCardsProps {
  onCardClick: (type: "bug" | "feature" | "comment") => void;
}

export function FeedbackCards({ onCardClick }: FeedbackCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Bug Report Card */}
      <div className="border-2 border-red-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <Bug className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Submit a Bug Report</h3>
          <p className="text-muted-foreground mb-6">
            Found something that's not working correctly? Let us know so we can
            fix it.
          </p>
          <Button
            onClick={() => onCardClick("bug")}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Report Bug
          </Button>
        </div>
      </div>

      {/* Feature Request Card */}
      <div className="border-2 border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center text-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Submit Feedback</h3>
          <p className="text-muted-foreground mb-6">
            Have ideas for new features or improvements? We'd love to hear your
            suggestions.
          </p>
          <Button
            onClick={() => onCardClick("feature")}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Submit Feedback
          </Button>
        </div>
      </div>

      {/* Contact Card */}
      <div className="border-2 border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col items-center text-center">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Get in Touch</h3>
          <p className="text-muted-foreground mb-6">
            Have questions or need assistance? Our team is here to help you.
          </p>
          <Button
            onClick={() => onCardClick("comment")}
            variant="outline"
            className="border-green-200 text-green-600 hover:bg-green-50"
          >
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
