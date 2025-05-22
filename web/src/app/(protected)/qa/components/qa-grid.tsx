"use client";

import { Question } from "@/lib/firebase/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAtom } from "jotai";
import { selectedQuestionAtom } from "./qa-store";

interface QAGridProps {
  questions: Question[];
}

export function QAGrid({ questions }: QAGridProps) {
  const [, setSelectedQuestion] = useAtom(selectedQuestionAtom);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {questions.map((question) => (
        <Card
          key={question.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setSelectedQuestion(question)}
          data-testid={`qa-card-${question.id}`}
        >
          <CardHeader>
            <CardTitle className="text-lg">{question.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Answer preview */}
              <p className="text-sm text-muted-foreground line-clamp-3">
                {question.answer || "No answer yet"}
              </p>

              {/* Tags */}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                      data-testid={`qa-tag-${tag}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Phases */}
              {question.phases && question.phases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.phases.map((phase) => (
                    <Badge
                      key={phase}
                      variant="outline"
                      className="text-xs"
                      data-testid={`qa-phase-${phase}`}
                    >
                      {phase}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
