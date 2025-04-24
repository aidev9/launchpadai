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
    description: "Create a new product",
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
];

export default xpActions;
