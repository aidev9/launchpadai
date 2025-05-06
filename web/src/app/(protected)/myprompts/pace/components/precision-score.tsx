"use client";

import React from "react";
import { ScoreWidget } from "./score-widget";

interface PrecisionScoreProps {
  score: number;
}

export function PrecisionScore({ score }: PrecisionScoreProps) {
  return (
    <ScoreWidget
      score={score}
      title="Precision Score"
      description="A higher precision score indicates a more effective prompt that will likely produce better results."
      lowScoreMessage="Try to be more specific"
      highScoreMessage="Your prompt is precise"
    />
  );
}
