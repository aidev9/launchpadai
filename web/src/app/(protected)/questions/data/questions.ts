export const questions = [
  {
    id: "q1",
    user_id: "user1",
    project_id: "project1",
    question: "How do I integrate Firebase with Next.js?",
    answer:
      "You can use the Firebase SDK directly in your Next.js application. For server components, use the Firebase Admin SDK.",
    tags: ["firebase", "nextjs", "integration"],
    last_modified: new Date("2025-04-10").toISOString(),
    createdAt: new Date("2025-04-01").toISOString(),
  },
  {
    id: "q2",
    user_id: "user2",
    project_id: "project1",
    question: "What is the best way to handle authentication?",
    answer:
      "Next.js provides several authentication options. For Firebase integration, you can use the Firebase Authentication SDK.",
    tags: ["authentication", "security", "firebase"],
    last_modified: new Date("2025-04-12").toISOString(),
    createdAt: new Date("2025-04-05").toISOString(),
  },
  {
    id: "q3",
    user_id: "user1",
    project_id: "project2",
    question: "How to optimize database queries?",
    answer:
      "Use indexes, limit the data you're fetching, and consider caching frequently accessed data.",
    tags: ["database", "performance", "optimization"],
    last_modified: new Date("2025-04-15").toISOString(),
    createdAt: new Date("2025-04-08").toISOString(),
  },
  {
    id: "q4",
    user_id: "user3",
    project_id: "project3",
    question: "Best practices for handling file uploads?",
    answer: null,
    tags: ["storage", "files", "upload"],
    last_modified: new Date("2025-04-16").toISOString(),
    createdAt: new Date("2025-04-16").toISOString(),
  },
  {
    id: "q5",
    user_id: "user2",
    project_id: "project2",
    question: "How to implement real-time updates?",
    answer:
      "Firebase Firestore provides real-time listeners that update your UI automatically when data changes.",
    tags: ["realtime", "firestore", "listeners"],
    last_modified: new Date("2025-04-17").toISOString(),
    createdAt: new Date("2025-04-10").toISOString(),
  },
];
