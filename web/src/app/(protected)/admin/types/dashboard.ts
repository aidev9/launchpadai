// User type definition
export interface User {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt: number;
  subscription?: string | { planType: string };
}

// Product type definition
export interface Product {
  id: string;
  name?: string;
  createdAt: number;
  userId?: string;
  user?: User | null;
}

// Prompt type definition
export interface Prompt {
  id: string;
  title?: string;
  createdAt: number;
  userId?: string;
  user?: User | null;
}

// Activity data type definition
export interface ActivityData {
  date: string;
  signups: number;
  products: number;
  prompts: number;
}
