# Update Breadcrumbs in Tech Stack Wizard

## Current Implementation

```tsx
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
```

## Updated Implementation

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

## Changes Made

1. Added a new breadcrumb item for "My Stacks" that links to the `/mystacks` route
2. Changed the label for the current page from "Tech Stack Wizard" to "Create Tech Stack" for better clarity and consistency

## Implementation Steps

1. Locate the Breadcrumbs component in the wizard page (around line 345)
2. Update the items array to include the "My Stacks" breadcrumb
3. Change the label for the current page from "Tech Stack Wizard" to "Create Tech Stack"

## Testing

1. Verify that the breadcrumbs display correctly
2. Verify that clicking on "My Stacks" navigates to the `/mystacks` route
3. Verify that the current page is correctly labeled as "Create Tech Stack" or "Edit Tech Stack" depending on the mode
