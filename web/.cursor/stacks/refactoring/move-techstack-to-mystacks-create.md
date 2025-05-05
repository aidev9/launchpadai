# Plan for Moving Tech Stack Wizard to /mystacks/create

## Current Structure

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

## Target Structure

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

## Implementation Steps

### 1. Create New Directory Structure

- Create `/app/(protected)/mystacks/create/` directory
- Create `/app/(protected)/mystacks/create/components/` directory
- Create `/app/(protected)/mystacks/create/components/steps/` directory

### 2. Move Files

- Move `/app/(protected)/techstack/page.tsx` to `/app/(protected)/mystacks/create/page.tsx`
- Move `/app/(protected)/techstack/components/card-checkbox.tsx` to `/app/(protected)/mystacks/create/components/card-checkbox.tsx`
- Move `/app/(protected)/techstack/components/card-radio.tsx` to `/app/(protected)/mystacks/create/components/card-radio.tsx`
- Move `/app/(protected)/techstack/components/step-indicator.tsx` to `/app/(protected)/mystacks/create/components/step-indicator.tsx`
- Move all files from `/app/(protected)/techstack/components/steps/` to `/app/(protected)/mystacks/create/components/steps/`

### 3. Update Imports in All Moved Files

- In all moved files, update import paths:
  - Replace `@/app/(protected)/techstack/components/` with `@/app/(protected)/mystacks/create/components/`

### 4. Update Breadcrumbs in the Wizard Page

- Modify the Breadcrumbs component in `page.tsx` to include My Stacks:

```tsx
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

### 5. Update Navigation in Other Files

- Update any references to the `/techstack` route to point to `/mystacks/create` instead
- Update the redirect after form submission to go to `/mystacks/stack` instead of `/mystacks/stack`

### 6. Testing

- Test the new route to ensure it works correctly
- Test navigation between pages
- Test form submission and redirection
