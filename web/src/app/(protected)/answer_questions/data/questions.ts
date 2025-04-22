export interface Question {
  id: string;
  text: string;
  phase:
    | "Discover"
    | "Validate"
    | "Design"
    | "Build"
    | "Secure"
    | "Launch"
    | "Grow";
}

export const questions: Question[] = [
  // Discover Phase Questions
  {
    id: "q1",
    text: "What problem does your product solve?",
    phase: "Discover",
  },
  {
    id: "q2",
    text: "Who are your target customers?",
    phase: "Discover",
  },
  {
    id: "q3",
    text: "What are the pain points your customers experience?",
    phase: "Discover",
  },
  {
    id: "q4",
    text: "How big is the market for your solution?",
    phase: "Discover",
  },
  {
    id: "q5",
    text: "What existing solutions address this problem?",
    phase: "Discover",
  },

  // Validate Phase Questions
  {
    id: "q6",
    text: "Have you interviewed potential customers?",
    phase: "Validate",
  },
  {
    id: "q7",
    text: "What feedback have you received on your concept?",
    phase: "Validate",
  },
  {
    id: "q8",
    text: "How will you test your minimum viable product?",
    phase: "Validate",
  },
  {
    id: "q9",
    text: "What metrics will you use to validate your idea?",
    phase: "Validate",
  },
  {
    id: "q10",
    text: "What is your customer acquisition cost estimate?",
    phase: "Validate",
  },

  // Design Phase Questions
  {
    id: "q11",
    text: "What is your product's unique value proposition?",
    phase: "Design",
  },
  {
    id: "q12",
    text: "How does your product differentiate from competitors?",
    phase: "Design",
  },
  {
    id: "q13",
    text: "What are the core features of your MVP?",
    phase: "Design",
  },
  {
    id: "q14",
    text: "How will users interact with your product?",
    phase: "Design",
  },
  {
    id: "q15",
    text: "What is your brand identity and positioning?",
    phase: "Design",
  },

  // Build Phase Questions
  {
    id: "q16",
    text: "What technologies will you use to build your product?",
    phase: "Build",
  },
  {
    id: "q17",
    text: "How will you structure your development team?",
    phase: "Build",
  },
  {
    id: "q18",
    text: "What is your development timeline?",
    phase: "Build",
  },
  {
    id: "q19",
    text: "How will you track development progress?",
    phase: "Build",
  },
  {
    id: "q20",
    text: "What is your approach to quality assurance?",
    phase: "Build",
  },

  // Secure Phase Questions
  {
    id: "q21",
    text: "How will you ensure data privacy?",
    phase: "Secure",
  },
  {
    id: "q22",
    text: "What security protocols will you implement?",
    phase: "Secure",
  },
  {
    id: "q23",
    text: "How will you handle user authentication?",
    phase: "Secure",
  },
  {
    id: "q24",
    text: "What compliance requirements apply to your product?",
    phase: "Secure",
  },
  {
    id: "q25",
    text: "How will you protect intellectual property?",
    phase: "Secure",
  },

  // Launch Phase Questions
  {
    id: "q26",
    text: "What is your go-to-market strategy?",
    phase: "Launch",
  },
  {
    id: "q27",
    text: "How will you generate initial user interest?",
    phase: "Launch",
  },
  {
    id: "q28",
    text: "What channels will you use for marketing?",
    phase: "Launch",
  },
  {
    id: "q29",
    text: "How will you measure launch success?",
    phase: "Launch",
  },
  {
    id: "q30",
    text: "What is your pricing strategy?",
    phase: "Launch",
  },

  // Grow Phase Questions
  {
    id: "q31",
    text: "What is your customer retention strategy?",
    phase: "Grow",
  },
  {
    id: "q32",
    text: "How will you scale your business?",
    phase: "Grow",
  },
  {
    id: "q33",
    text: "What are your key performance indicators?",
    phase: "Grow",
  },
  {
    id: "q34",
    text: "What is your fundraising strategy?",
    phase: "Grow",
  },
  {
    id: "q35",
    text: "How will you expand your product offering?",
    phase: "Grow",
  },
];

// This is a small sample. In a real implementation, you would have ~300 questions.
// For demo purposes, we're using a smaller set that can be expanded later.

// Helper function to get questions by phase
export const getQuestionsByPhase = (phase: Question["phase"]) => {
  return questions.filter((q) => q.phase === phase);
};

// Helper function to get a random unanswered question
export const getRandomUnansweredQuestion = (
  answeredIds: string[],
  filteredQuestions?: Question[]
) => {
  // Use filtered questions if provided, otherwise use all questions
  const questionSet = filteredQuestions || questions;

  const unansweredQuestions = questionSet.filter(
    (q) => !answeredIds.includes(q.id)
  );
  if (unansweredQuestions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
  return unansweredQuestions[randomIndex];
};
