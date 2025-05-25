// Common types for the admin dashboard

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt?: number;
}

export interface User extends BaseEntity {
  email: string;
  displayName?: string;
  photoURL?: string;
  lastLogin?: number;
  isAdmin?: boolean;
  xp?: number;
  level?: number;
}

export interface Product extends BaseEntity {
  title: string;
  description?: string;
  userId: string;
  user?: User;
  isPublic?: boolean;
  views?: number;
  likes?: number;
  tags?: string[];
}

export interface Prompt extends BaseEntity {
  title: string;
  content?: string;
  userId: string;
  user?: User;
  isPublic?: boolean;
  views?: number;
  likes?: number;
  tags?: string[];
}

export interface Stack extends BaseEntity {
  title: string;
  description?: string;
  userId: string;
  user?: User;
  isPublic?: boolean;
  components?: string[];
  views?: number;
  likes?: number;
  tags?: string[];
}

export interface Collection extends BaseEntity {
  title: string;
  description?: string;
  userId: string;
  user?: User;
  isPublic?: boolean;
  items?: string[];
  itemCount?: number;
  views?: number;
  likes?: number;
  tags?: string[];
}

export interface Agent extends BaseEntity {
  title: string;
  description?: string;
  userId: string;
  user?: User;
  isPublic?: boolean;
  capabilities?: string[];
  usageCount?: number;
  views?: number;
  likes?: number;
  tags?: string[];
}

export interface ActivityData {
  date: string;
  signups: number;
  products: number;
  prompts: number;
  stacks: number;
  collections: number;
  agents: number;
}

export interface EntityCount {
  total: number;
  active: number;
  trending: number;
  new: number;
}

export interface AdminStats {
  users: EntityCount;
  products: EntityCount;
  prompts: EntityCount;
  stacks: EntityCount;
  collections: EntityCount;
  agents: EntityCount;
}

export interface TableColumn {
  id: string;
  header: string;
  accessorKey?: string;
  cell?: (info: any) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

export interface FilterOption {
  id: string;
  label: string;
  options: {
    label: string;
    value: string;
  }[];
}

// Chart data types are now defined in the admin-chart.tsx component
