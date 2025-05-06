"use client";

import React from "react";
import { ScoreWidget } from "./score-widget";

interface DefinitionScoreProps {
  score: number;
}

export function DefinitionScore({ score }: DefinitionScoreProps) {
  return (
    <ScoreWidget
      score={score}
      title="Definition Score"
      description="A higher definition score indicates a well-defined problem statement with clear context and constraints."
      lowScoreMessage="Add more problem details"
      highScoreMessage="Your problem is well-defined"
    />
  );
}
