export interface XpAction {
  id: string;
  name: string;
  description: string;
  points: number;
}

export const xpActions: XpAction[] = [
  {
    id: "signup",
    name: "Sign Up",
    description: "Create a new account",
    points: 10,
  },
  {
    id: "signin",
    name: "Sign In",
    description: "Sign in to your account",
    points: 5,
  },
  {
    id: "create_product",
    name: "Create Product",
    description: "Created a new product or startup project.",
    points: 50,
  },
  {
    id: "answer_question",
    name: "Answer Question",
    description: "Answer a product question",
    points: 5,
  },
  {
    id: "create_note",
    name: "Create Note",
    description: "Create a new note",
    points: 5,
  },
  {
    id: "add_asset",
    name: "Add Asset",
    description: "Add a new asset to a product",
    points: 10,
  },
  {
    id: "generate_asset",
    name: "Generate Asset Content",
    description: "Generate content for an asset using AI",
    points: 5,
  },
  {
    id: "download_asset",
    name: "Download Asset",
    description: "Download a single asset",
    points: 5,
  },
  {
    id: "download_multiple_assets",
    name: "Download Multiple Assets",
    description: "Download multiple assets at once",
    points: 10,
  },
  {
    id: "add_question",
    name: "Add Question",
    description: "Added a new question to guide asset generation.",
    points: 5,
  },
  {
    id: "create_prompt",
    name: "Create Prompt",
    description: "Create a new prompt",
    points: 30,
  },
  {
    id: "use_prompt_template",
    name: "Use Prompt Template",
    description: "Use an existing prompt as a template",
    points: 30,
  },
  {
    id: "create_stack",
    name: "Create Stack",
    description: "Create a new stack",
    points: 75,
  },
  {
    id: "create_stack_asset",
    name: "Create Stack Asset",
    description: "Create a new asset in a stack",
    points: 15,
  },
  {
    id: "submit_feedback",
    name: "Submit Feedback",
    description: "Submit feedback or feature request",
    points: 25,
  },
];

export default xpActions;
