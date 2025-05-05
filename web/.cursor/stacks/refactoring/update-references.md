# Update References to /techstack Route

When moving the Tech Stack Wizard from `/techstack` to `/mystacks/create`, we need to update all references to the old route in the codebase. Here are the files that need to be updated:

## 1. Update in `web/src/lib/firebase/techstacks.ts`

There are multiple instances of `revalidatePath("/techstack");` that need to be updated to `revalidatePath("/mystacks/create");`:

```typescript
// Line 52
revalidatePath("/mystacks/create");
revalidatePath("/mystacks");

// Line 175
revalidatePath("/mystacks/create");
revalidatePath("/mystacks");

// Line 217
revalidatePath("/mystacks/create");
revalidatePath("/mystacks");

// Line 259
revalidatePath("/mystacks/create");
revalidatePath("/mystacks");
```

## 2. Update in `web/src/app/(protected)/mystacks/page.tsx`

Update the `handleCreateTechStack` function to navigate to the new route:

```typescript
// Line 88-90
const handleCreateTechStack = () => {
  router.push("/mystacks/create");
};
```

## 3. Update in `web/src/app/(protected)/mystacks/stack/handlers/techStackHandlers.ts`

Update the `handleEdit` function to navigate to the new route with the tech stack ID as a query parameter:

```typescript
// Line 22-24
// Navigate to the tech stack wizard with the tech stack ID as a query parameter
router.push(`/mystacks/create?id=${selectedTechStack.id}`);
```

## 4. Update Import Paths in All Step Components

All step components import from `@/app/(protected)/techstack/components/`. These imports need to be updated to `@/app/(protected)/mystacks/create/components/`:

For example, in `web/src/app/(protected)/techstack/components/steps/app-type-step.tsx`:

```typescript
// Before
import { CardRadio } from "@/app/(protected)/techstack/components/card-radio";

// After
import { CardRadio } from "@/app/(protected)/mystacks/create/components/card-radio";
```

This needs to be done for all step components:

- `app-type-step.tsx`
- `frontend-step.tsx`
- `backend-step.tsx`
- `database-step.tsx`
- `ai-agent-step.tsx`
- `integrations-step.tsx`
- `deployment-step.tsx`
- `app-details-step.tsx`

## 5. Update in `web/src/app/(protected)/techstack/page.tsx`

Update the import paths for all step components:

```typescript
// Before
import { AppTypeStep } from "@/app/(protected)/techstack/components/steps/app-type-step";
import { FrontEndStep } from "@/app/(protected)/techstack/components/steps/frontend-step";
import { BackendStep } from "@/app/(protected)/techstack/components/steps/backend-step";
import { DatabaseStep } from "@/app/(protected)/techstack/components/steps/database-step";
import { AIAgentStep } from "@/app/(protected)/techstack/components/steps/ai-agent-step";
import { IntegrationsStep } from "@/app/(protected)/techstack/components/steps/integrations-step";
import { DeploymentStep } from "@/app/(protected)/techstack/components/steps/deployment-step";
import { AppDetailsStep } from "@/app/(protected)/techstack/components/steps/app-details-step";
import { ReviewStep } from "@/app/(protected)/techstack/components/steps/review-step";
import { StepIndicator } from "@/app/(protected)/techstack/components/step-indicator";

// After
import { AppTypeStep } from "@/app/(protected)/mystacks/create/components/steps/app-type-step";
import { FrontEndStep } from "@/app/(protected)/mystacks/create/components/steps/frontend-step";
import { BackendStep } from "@/app/(protected)/mystacks/create/components/steps/backend-step";
import { DatabaseStep } from "@/app/(protected)/mystacks/create/components/steps/database-step";
import { AIAgentStep } from "@/app/(protected)/mystacks/create/components/steps/ai-agent-step";
import { IntegrationsStep } from "@/app/(protected)/mystacks/create/components/steps/integrations-step";
import { DeploymentStep } from "@/app/(protected)/mystacks/create/components/steps/deployment-step";
import { AppDetailsStep } from "@/app/(protected)/mystacks/create/components/steps/app-details-step";
import { ReviewStep } from "@/app/(protected)/mystacks/create/components/steps/review-step";
import { StepIndicator } from "@/app/(protected)/mystacks/create/components/step-indicator";
```

## 6. Update Redirect After Form Submission

In `web/src/app/(protected)/techstack/page.tsx`, update the redirect after form submission:

```typescript
// Line 241
router.push("/mystacks/stack");
```

## Testing

After making these changes, test the following:

1. Creating a new tech stack from the My Stacks page
2. Editing an existing tech stack from the tech stack detail page
3. Verify that revalidation works correctly
4. Verify that all components are imported correctly and the wizard functions as expected
