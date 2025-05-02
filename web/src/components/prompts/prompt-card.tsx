import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Prompt } from "@/lib/firebase/schema";
import { getPhaseColor } from "./phase-filter";

interface PromptCardProps {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <Card
      className="p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(prompt)}
    >
      <h3 className="font-semibold text-xl mb-2 line-clamp-1">
        {prompt.title}
      </h3>

      <div className="flex flex-wrap gap-1 mb-3">
        {prompt.phaseTags.map((tag) => (
          <Badge key={tag} variant="secondary" className={getPhaseColor(tag)}>
            {tag}
          </Badge>
        ))}
      </div>

      <p className="text-muted-foreground line-clamp-3">{prompt.body}</p>
    </Card>
  );
}
