export interface Prompt {
  id: string;
  label: string;
  md_content: string;
}

export const prompts: Prompt[] = [
  {
    id: "base-rules",
    label: "Base Rules",
    md_content: `# Base Rules for Your Project

## Coding Standards
- Use TypeScript for type safety
- Follow the DRY (Don't Repeat Yourself) principle
- Write unit tests for critical functionality
- Use ESLint and Prettier for code formatting

## Project Structure
- Organize code by feature rather than type
- Keep related code close together
- Use clear, descriptive naming conventions
- Create reusable components and utilities

## Git Workflow
- Use feature branches for development
- Write clear, descriptive commit messages
- Perform code reviews before merging
- Keep pull requests focused and manageable

## Documentation
- Document all public APIs and interfaces
- Include usage examples where appropriate
- Update documentation when code changes
- Use JSDoc comments for functions and classes
`,
  },
  {
    id: "architecture",
    label: "Architecture",
    md_content: `# Project Architecture

## Frontend Architecture
- **Next.js**: Server components for improved SEO and performance
- **React**: Component-based UI development
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible, customizable component library

## State Management
- **Jotai**: Atomic state management solution
- **React Context**: For theme and authentication state
- **Server Components**: For server-side state

## Backend Integration
- **Firebase**: Authentication, database, and storage
- **Vercel AI SDK**: For AI-powered features
- **Server Actions**: For server-side mutations

## Data Flow
- Use Server Components for data fetching
- Use Server Actions for data mutations
- Keep client-side state minimal and focused
`,
  },
  {
    id: "tasks",
    label: "Tasks",
    md_content: `# Project Tasks and Roadmap

## Phase 1: Initial Setup
- [ ] Project scaffolding with Next.js
- [ ] Setup TailwindCSS and shadcn/ui
- [ ] Configure Firebase integration
- [ ] Setup authentication flow

## Phase 2: Core Features
- [ ] Implement dashboard layout
- [ ] Create product management features
- [ ] Build asset generation system
- [ ] Develop review and editing tools

## Phase 3: AI Integration
- [ ] Integrate Vercel AI SDK
- [ ] Create AI assistant for content generation
- [ ] Implement prompt engineering tools
- [ ] Set up feedback loop for AI improvements

## Phase 4: Launch Preparation
- [ ] Performance optimization
- [ ] Security audit and improvements
- [ ] Cross-browser testing
- [ ] Deployment configuration
`,
  },
  {
    id: "styleguide",
    label: "Styleguide",
    md_content: `# Project Styleguide

## Typography
- **Headings**: Use size scale based on shadcn/ui defaults
- **Body Text**: Inter font, 16px base size
- **Line Heights**: 1.5 for body, 1.2 for headings

## Colors
- **Primary**: #0070f3 (blue)
- **Secondary**: #6c757d (gray)
- **Accent**: #f97316 (orange)
- **Background**: #ffffff (light mode), #121212 (dark mode)

## Components
- Follow shadcn/ui component patterns
- Create consistent spacing using rem units
- Use 8px grid system (0.5rem increments)
- Ensure responsive behavior on all components

## Icons
- Use Lucide icons consistently
- Keep icon sizes standardized (16px, 20px, 24px)
- Ensure icons have appropriate ARIA attributes
`,
  },
  {
    id: "rules",
    label: "Rules",
    md_content: `# Development Rules and Guidelines

## Code Contributions
- All code must pass ESLint checks
- Tests must pass before merge
- Performance impact should be considered
- Accessibility must not be compromised

## Feature Development
- Create a feature specification document
- Design components before implementation
- Get design review before developing
- Include appropriate test coverage

## Bug Fixes
- Reproduce the bug first
- Write a test that exposes the bug
- Fix the bug and ensure test passes
- Document the fix for future reference

## Releases
- Use semantic versioning
- Create release notes for each version
- Test thoroughly on staging environment
- Monitor post-deploy for any issues
`,
  },
];
