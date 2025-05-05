# Tech Stack Wizard Refactoring Plan

This document outlines the comprehensive plan for refactoring the Tech Stack Wizard, including moving it from `/techstack` to `/mystacks/create` and updating the Breadcrumbs.

## 1. Move Tech Stack Wizard to /mystacks/create

### Directory Structure Changes

**Current Structure:**

```
/app/(protected)/techstack/
├── page.tsx
└── components/
    ├── card-checkbox.tsx
    ├── card-radio.tsx
    ├── step-indicator.tsx
    └── steps/
        ├── ai-agent-step.tsx
        ├── app-details-step.tsx
        ├── app-type-step.tsx
        ├── backend-step.tsx
        ├── database-step.tsx
        ├── deployment-step.tsx
        ├── frontend-step.tsx
        ├── integrations-step.tsx
        └── review-step.tsx
```

**Target Structure:**

```
/app/(protected)/mystacks/create/
├── page.tsx
└── components/
    ├── card-checkbox.tsx
    ├── card-radio.tsx
    ├── step-indicator.tsx
    └── steps/
        ├── ai-agent-step.tsx
        ├── app-details-step.tsx
        ├── app-type-step.tsx
        ├── backend-step.tsx
        ├── database-step.tsx
        ├── deployment-step.tsx
        ├── frontend-step.tsx
        ├── integrations-step.tsx
        └── review-step.tsx
```

### Implementation Steps

1. Create the new directory structure:

   - Create `/app/(protected)/mystacks/create/` directory
   - Create `/app/(protected)/mystacks/create/components/` directory
   - Create `/app/(protected)/mystacks/create/components/steps/` directory

2. Move files:
   - Move `/app/(protected)/techstack/page.tsx` to `/app/(protected)/mystacks/create/page.tsx`
   - Move `/app/(protected)/techstack/components/card-checkbox.tsx` to `/app/(protected)/mystacks/create/components/card-checkbox.tsx`
   - Move `/app/(protected)/techstack/components/card-radio.tsx` to `/app/(protected)/mystacks/create/components/card-radio.tsx`
   - Move `/app/(protected)/techstack/components/step-indicator.tsx` to `/app/(protected)/mystacks/create/components/step-indicator.tsx`
   - Move all files from `/app/(protected)/techstack/components/steps/` to `/app/(protected)/mystacks/create/components/steps/`

## 2. Update Import Paths

Update import paths in all moved files:

1. In all step components, update imports:

   ```typescript
   // Before
   import { CardRadio } from "@/app/(protected)/techstack/components/card-radio";

   // After
   import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";
   ```

2. In `page.tsx`, update imports for all step components:

   ```typescript
   // Before
   import { AppTypeStep } from "@/app/(protected)/techstack/components/steps/app-type-step";
   // ... other imports

   // After
   import { AppTypeStep } from "@/app/(protected)/mystacks/create/components/steps/app-type-step";
   // ... other imports
   ```

## 3. Update Breadcrumbs

Update the Breadcrumbs component in `page.tsx`:

```typescript
// Before
<Breadcrumbs
  items={[
    { label: "Home", href: "/dashboard" },
    {
      label: isEditMode ? "Edit Tech Stack" : "Tech Stack Wizard",
      href: "",
      isCurrentPage: true,
    },
  ]}
/>

// After
<Breadcrumbs
  items={[
    { label: "Home", href: "/dashboard" },
    { label: "My Stacks", href: "/mystacks" },
    {
      label: isEditMode ? "Edit Tech Stack" : "Create Tech Stack",
      href: "",
      isCurrentPage: true,
    },
  ]}
/>
```

## 4. Update References to /techstack Route

1. In `web/src/lib/firebase/techstacks.ts`, update revalidation paths:

   ```typescript
   // Before
   revalidatePath("/techstack");

   // After
   revalidatePath("/mystacks/create");
   ```

2. In `web/src/app/(protected)/mystacks/page.tsx`, update navigation:

   ```typescript
   // Before
   router.push("/techstack");

   // After
   router.push("/mystacks/create");
   ```

3. In `web/src/app/(protected)/mystacks/stack/handlers/techStackHandlers.ts`, update navigation:

   ```typescript
   // Before
   router.push(`/techstack?id=${selectedTechStack.id}`);

   // After
   router.push(`/mystacks/create?id=${selectedTechStack.id}`);
   ```

4. In `web/src/app/(protected)/techstack/page.tsx`, update redirect after form submission:

   ```typescript
   // Before
   router.push("/mystacks/stack");

   // After (no change needed, already correct)
   router.push("/mystacks/stack");
   ```

## 5. Testing Plan

1. Test creating a new tech stack:

   - Navigate to My Stacks page
   - Click "Create Tech Stack" button
   - Verify that you're redirected to `/mystacks/create`
   - Verify that the breadcrumbs show "Home > My Stacks > Create Tech Stack"
   - Complete the wizard and verify that you're redirected to `/mystacks/stack`

2. Test editing an existing tech stack:

   - Navigate to a tech stack detail page
   - Click "Edit" button
   - Verify that you're redirected to `/mystacks/create?id=<tech-stack-id>`
   - Verify that the breadcrumbs show "Home > My Stacks > Edit Tech Stack"
   - Make changes and verify that you're redirected to `/mystacks/stack`

3. Test navigation:
   - Verify that clicking "My Stacks" in the breadcrumbs navigates to `/mystacks`
   - Verify that clicking "Home" in the breadcrumbs navigates to `/dashboard`

## 6. Implementation Order

1. Create the new directory structure
2. Move files to the new structure
3. Update import paths in all moved files
4. Update the Breadcrumbs component
5. Update references to the `/techstack` route
6. Test the changes
7. Remove the old `/techstack` directory if everything works correctly
