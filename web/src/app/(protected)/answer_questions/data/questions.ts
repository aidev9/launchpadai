export interface Question {
  id: string;
  text: string;
  order: number;
  phases: Array<
    "Discover" | "Validate" | "Design" | "Build" | "Secure" | "Launch" | "Grow"
  >;
}

export const questions: Question[] = [
  // Discover Phase Questions
  {
    id: "q1",
    text: "What problem does your product solve?",
    order: 0,
    phases: ["Discover"],
  },
  {
    id: "q2",
    text: "Who are your target customers?",
    order: 10,
    phases: ["Discover"],
  },
  {
    id: "q3",
    text: "What are the pain points your customers experience?",
    order: 20,
    phases: ["Discover"],
  },
  {
    id: "q4",
    text: "How big is the market for your solution?",
    order: 30,
    phases: ["Discover"],
  },
  {
    id: "q5",
    text: "What existing solutions address this problem?",
    order: 40,
    phases: ["Discover"],
  },

  // Validate Phase Questions
  {
    id: "q6",
    text: "Have you interviewed potential customers?",
    order: 50,
    phases: ["Validate"],
  },
  {
    id: "q7",
    text: "What feedback have you received on your concept?",
    order: 60,
    phases: ["Validate"],
  },
  {
    id: "q8",
    text: "How will you test your minimum viable product?",
    order: 70,
    phases: ["Validate"],
  },
  {
    id: "q9",
    text: "What metrics will you use to validate your idea?",
    order: 80,
    phases: ["Validate"],
  },
  {
    id: "q10",
    text: "What is your customer acquisition cost estimate?",
    order: 90,
    phases: ["Validate"],
  },

  // Design Phase Questions
  {
    id: "q11",
    text: "What is your product's unique value proposition?",
    order: 100,
    phases: ["Design"],
  },
  {
    id: "q12",
    text: "How does your product differentiate from competitors?",
    order: 110,
    phases: ["Design"],
  },
  {
    id: "q13",
    text: "What are the core features of your MVP?",
    order: 120,
    phases: ["Design"],
  },
  {
    id: "q14",
    text: "How will users interact with your product?",
    order: 130,
    phases: ["Design"],
  },
  {
    id: "q15",
    text: "What is your brand identity and positioning?",
    order: 140,
    phases: ["Design"],
  },

  // Build Phase Questions
  {
    id: "q16",
    text: "What technologies will you use to build your product?",
    order: 150,
    phases: ["Build"],
  },
  {
    id: "q17",
    text: "How will you structure your development team?",
    order: 160,
    phases: ["Build"],
  },
  {
    id: "q18",
    text: "What is your development timeline?",
    order: 170,
    phases: ["Build"],
  },
  {
    id: "q19",
    text: "How will you track development progress?",
    order: 180,
    phases: ["Build"],
  },
  {
    id: "q20",
    text: "What is your approach to quality assurance?",
    order: 190,
    phases: ["Build"],
  },

  // Secure Phase Questions
  {
    id: "q21",
    text: "How will you ensure data privacy?",
    order: 200,
    phases: ["Secure"],
  },
  {
    id: "q22",
    text: "What security protocols will you implement?",
    order: 210,
    phases: ["Secure"],
  },
  {
    id: "q23",
    text: "How will you handle user authentication?",
    order: 220,
    phases: ["Secure"],
  },
  {
    id: "q24",
    text: "What compliance requirements apply to your product?",
    order: 230,
    phases: ["Secure"],
  },
  {
    id: "q25",
    text: "How will you protect intellectual property?",
    order: 240,
    phases: ["Secure"],
  },

  // Launch Phase Questions
  {
    id: "q26",
    text: "What is your go-to-market strategy?",
    order: 250,
    phases: ["Launch"],
  },
  {
    id: "q27",
    text: "How will you generate initial user interest?",
    order: 260,
    phases: ["Launch"],
  },
  {
    id: "q28",
    text: "What channels will you use for marketing?",
    order: 270,
    phases: ["Launch"],
  },
  {
    id: "q29",
    text: "How will you measure launch success?",
    order: 280,
    phases: ["Launch"],
  },
  {
    id: "q30",
    text: "What is your pricing strategy?",
    order: 290,
    phases: ["Launch"],
  },

  // Grow Phase Questions
  {
    id: "q31",
    text: "What is your customer retention strategy?",
    order: 300,
    phases: ["Grow"],
  },
  {
    id: "q32",
    text: "How will you scale your business?",
    order: 310,
    phases: ["Grow"],
  },
  {
    id: "q33",
    text: "What are your key performance indicators?",
    order: 320,
    phases: ["Grow"],
  },
  {
    id: "q34",
    text: "What is your fundraising strategy?",
    order: 330,
    phases: ["Grow"],
  },
  {
    id: "q35",
    text: "How will you expand your product offering?",
    order: 340,
    phases: ["Grow"],
  },
];

// This is a small sample. In a real implementation, you would have ~300 questions.
// For demo purposes, we're using a smaller set that can be expanded later.

// Helper function to get questions by phase
export const getQuestionsByPhase = (phase: Question["phases"][0]) => {
  return questions.filter((q) => q.phases.includes(phase));
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
