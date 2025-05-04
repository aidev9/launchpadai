# Code Refactoring Plan

## Overview

After reviewing the codebase, I've identified two files that exceed 400 lines of code and should be broken up into smaller, more maintainable modules:

1. **techstack-assets.ts** (573 lines)
2. **mystacks/stack/page.tsx** (731 lines)

This document outlines a plan for refactoring these files to improve code organization and maintainability.

## 1. Refactoring `techstack-assets.ts`

### Current Issues

- File is 573 lines long
- Contains multiple concerns (CRUD operations, content generation, system prompts)
- Large system prompts for different asset types make the file difficult to navigate

### Proposed Solution

Split the file into three separate modules:

#### 1.1. `asset-prompts.ts`

Extract all AI system prompts into a dedicated utility file:

```typescript
// Example structure
export interface AssetPrompt {
  systemPrompt: string;
  userPromptTemplate: string;
}

export const assetPrompts: Record<string, AssetPrompt> = {
  PRD: {
    systemPrompt: `...`,
    userPromptTemplate: `...`,
  },
  Architecture: {
    systemPrompt: `...`,
    userPromptTemplate: `...`,
  },
  // Other asset types...
};

export function getAssetPrompt(assetType: string): AssetPrompt {
  return assetPrompts[assetType] || assetPrompts.Default;
}

export function formatTechStackDetails(techStackDetails: any): string {
  // Format tech stack details for prompts
}

export function generateUserPrompt(
  assetType: string,
  techStackDetails: any,
  userInstructions?: string
): string {
  // Generate user prompt with tech stack details
}
```

#### 1.2. `asset-crud.ts`

Extract basic CRUD operations into a separate file:

```typescript
// Example structure
export function getTechStackAssetsRef(userId: string, techStackId: string) {
  // Get reference to assets collection
}

export async function createTechStackAsset(data: TechStackAssetInput) {
  // Create asset
}

export async function getTechStackAssets(techStackId: string) {
  // Get all assets for a tech stack
}

export async function getTechStackAsset(techStackId: string, assetId: string) {
  // Get a single asset
}

export async function updateTechStackAsset(
  techStackId: string,
  assetId: string,
  data: Partial<TechStackAssetInput>
) {
  // Update asset
}

export async function deleteTechStackAsset(
  techStackId: string,
  assetId: string
) {
  // Delete asset
}
```

#### 1.3. `asset-generation.ts`

Extract content generation logic into a separate file:

```typescript
// Example structure
export async function generateDefaultAssets(
  techStackId: string,
  techStackName: string
) {
  // Generate default assets
}

export async function generateAssetContent(
  techStackId: string,
  assetId: string,
  assetType: string,
  techStackDetails: any,
  userInstructions?: string
) {
  // Generate content for an asset
}
```

#### 1.4. Updated `techstack-assets.ts` (Main File)

The main file becomes a simple re-export:

```typescript
"use server";

// Re-export from asset-crud.ts
export {
  createTechStackAsset,
  getTechStackAssets,
  getTechStackAsset,
  updateTechStackAsset,
  deleteTechStackAsset,
} from "./utils/asset-crud";

// Re-export from asset-generation.ts
export {
  generateDefaultAssets,
  generateAssetContent,
} from "./utils/asset-generation";
```

## 2. Refactoring `mystacks/stack/page.tsx`

### Current Issues

- File is 731 lines long
- Contains multiple concerns (data fetching, state management, event handlers, UI rendering)
- Many event handlers that could be extracted

### Proposed Solution

Split the file into several smaller modules:

#### 2.1. `hooks/useTechStackDetail.ts`

Extract data fetching and state management into a custom hook:

```typescript
// Example structure
export function useTechStackDetail() {
  // State declarations
  // Data fetching effects
  // Return state and setters
}
```

#### 2.2. `handlers/techStackHandlers.ts`

Extract tech stack-related event handlers:

```typescript
// Example structure
export function useTechStackHandlers(
  selectedTechStack: TechStack | null,
  setIsLoading: (loading: boolean) => void,
  setIsDeleteDialogOpen: (open: boolean) => void
) {
  // Handler functions for tech stack operations
  return {
    handleBack,
    handleEdit,
    handleDelete,
    handleDownloadAssets,
  };
}
```

#### 2.3. `handlers/assetHandlers.ts`

Extract asset-related event handlers:

```typescript
// Example structure
export function useAssetHandlers(
  selectedTechStack: TechStack | null,
  assets: TechStackAsset[],
  setAssets: (assets: TechStackAsset[]) => void
  // Other parameters...
) {
  // Handler functions for asset operations
  return {
    handleCreateAsset,
    handleEditAsset,
    handleSaveAsset,
    handleDeleteAsset,
    handleGenerateContent,
    handleCopyAsset,
    handleDownloadAsset,
  };
}
```

#### 2.4. `components/TechStackGeneral.tsx`

Extract the general tab content into a separate component:

```typescript
// Example structure
export function TechStackGeneral({
  selectedTechStack,
}: {
  selectedTechStack: TechStack;
}) {
  // Render general tech stack information
}
```

#### 2.5. `components/TechStackAssets.tsx`

Extract the assets tab content into a separate component:

```typescript
// Example structure
export function TechStackAssets({
  assets,
  selectedAsset,
  // Other props...
}) {
  // Render assets tab content
}
```

#### 2.6. Updated `page.tsx` (Main File)

The main file becomes much simpler:

```typescript
// Example structure
export default function TechStackDetail() {
  // Use custom hooks
  const {
    selectedTechStack,
    assets,
    // Other state...
  } = useTechStackDetail();

  const { handleBack, handleEdit, handleDelete, handleDownloadAssets } =
    useTechStackHandlers(/* params */);

  const {
    handleCreateAsset,
    handleEditAsset,
    // Other handlers...
  } = useAssetHandlers(/* params */);

  // Render loading and error states

  // Render main UI with extracted components
}
```

## 3. Implementation Strategy

1. Create the new directory structure
2. Extract the system prompts first
3. Extract CRUD operations
4. Extract content generation logic
5. Update the main techstack-assets.ts file
6. Extract hooks and handlers from page.tsx
7. Extract components from page.tsx
8. Update the main page.tsx file

## 4. Benefits

- Improved code organization and maintainability
- Better separation of concerns
- Easier testing and debugging
- More manageable file sizes
- Better code reuse
