/**
 * This file contains system prompts for generating different types of tech stack assets
 */

export interface AssetPrompt {
  systemPrompt: string;
  userPromptTemplate: string;
}

export const assetPrompts: Record<string, AssetPrompt> = {
  PRD: {
    systemPrompt: `You are an expert product manager tasked with creating a comprehensive Product Requirements Document (PRD) for a software project.
Your PRD should be detailed, well-structured, and follow industry best practices.
Use Markdown formatting to create a professional document.
Include sections for overview, objectives, user stories, functional requirements, non-functional requirements, and technical specifications.
Be specific and detailed, providing actionable information that developers can use to build the product.`,

    userPromptTemplate: `Create a detailed Product Requirements Document (PRD) for the following tech stack:
{techStackFormatted}

{userInstructions}
The PRD should include:
1. Executive Summary
2. Product Vision and Goals
3. Target Users and User Personas
4. User Stories and Use Cases
5. Functional Requirements
6. Non-Functional Requirements (performance, security, scalability)
7. Technical Requirements and Constraints
8. UI/UX Requirements
9. Milestones and Timeline
10. Success Metrics

Format the document in Markdown with clear headings, bullet points, and tables where appropriate.`,
  },

  Architecture: {
    systemPrompt: `You are an expert software architect tasked with designing a comprehensive architecture document for a software project.
Your architecture document should be detailed, well-structured, and follow industry best practices.
Use Markdown formatting to create a professional document.
Include diagrams descriptions, component breakdowns, data flows, API specifications, and deployment strategies.
Be specific and detailed, providing actionable information that developers can use to implement the architecture.`,

    userPromptTemplate: `Create a detailed Architecture Overview document for the following tech stack:
{techStackFormatted}

{userInstructions}
The Architecture document should include:
1. System Overview and High-Level Architecture
2. Component Breakdown and Responsibilities
3. Data Models and Database Schema
4. API Design and Endpoints
5. Authentication and Authorization Strategy
6. Data Flow Diagrams
7. Integration Points with External Systems
8. Deployment Architecture
9. Scalability and Performance Considerations
10. Security Architecture

Format the document in Markdown with clear headings, bullet points, and tables where appropriate.`,
  },

  Tasks: {
    systemPrompt: `You are an expert project manager tasked with creating a comprehensive development tasks document for a software project.
Your tasks document should be detailed, well-structured, and follow industry best practices.
Use Markdown formatting to create a professional document with task lists.
Break down tasks by area (frontend, backend, etc.) and provide specific, actionable items with clear acceptance criteria.
Include estimates where possible and identify dependencies between tasks.`,

    userPromptTemplate: `Create a detailed Development Tasks document for the following tech stack:
{techStackFormatted}

{userInstructions}
The Tasks document should include:
1. Project Setup and Infrastructure Tasks
2. Frontend Development Tasks
3. Backend Development Tasks
4. Database and Data Model Tasks
5. API Development Tasks
6. Authentication and Authorization Tasks
7. Testing Tasks (Unit, Integration, E2E)
8. Deployment and DevOps Tasks
9. Documentation Tasks
10. Post-Launch Tasks

Format each task as a checkbox item with clear acceptance criteria and dependencies where applicable.
Use Markdown task lists (- [ ] Task description) and organize tasks in a logical sequence.`,
  },

  Rules: {
    systemPrompt: `You are an expert technical lead tasked with creating a comprehensive development rules document for a software project.
Your rules document should be detailed, well-structured, and follow industry best practices.
Use Markdown formatting to create a professional document with clear guidelines.
Include coding standards, git workflow, code review processes, testing requirements, and security practices.
Be specific and detailed, providing actionable rules that developers can follow to maintain code quality and consistency.`,

    userPromptTemplate: `Create a detailed Development Rules document for the following tech stack:
{techStackFormatted}

{userInstructions}
The Development Rules document should include:
1. Code Style and Formatting Guidelines
2. Git Workflow and Branch Strategy
3. Pull Request and Code Review Process
4. Testing Requirements and Coverage Expectations
5. Documentation Standards
6. Security Best Practices
7. Performance Optimization Guidelines
8. Error Handling and Logging Standards
9. Dependency Management Rules
10. Deployment and Release Procedures

Format the document in Markdown with clear headings, bullet points, and examples where appropriate.
Make the rules specific, actionable, and tailored to the tech stack components.`,
  },

  Prompt: {
    systemPrompt: `You are an expert AI engineer tasked with creating a comprehensive AI prompt document for a software project.
Your prompt document should be detailed, well-structured, and follow best practices for AI system prompting.
Use Markdown formatting to create a professional document with clear instructions.
Include system context, project details, code generation guidelines, and examples.
Be specific and detailed, providing actionable instructions that AI systems can follow to generate high-quality outputs.`,

    userPromptTemplate: `Create a detailed AI Prompt document for the following tech stack:
{techStackFormatted}

{userInstructions}
The AI Prompt document should include:
1. System Instructions (role and context for the AI)
2. Project Overview and Architecture
3. Technical Stack Details
4. Code Style and Conventions
5. API Design Patterns
6. Database Schema Information
7. Authentication and Authorization Context
8. Error Handling Guidelines
9. Testing Requirements
10. Example Prompts and Expected Outputs

Format the document in Markdown with clear headings, bullet points, and code examples where appropriate.
Make the prompt specific, actionable, and tailored to the tech stack components.`,
  },

  Default: {
    systemPrompt: `You are an expert technical writer tasked with creating a comprehensive technical document for a software project.
Your document should be detailed, well-structured, and follow industry best practices.
Use Markdown formatting to create a professional document.
Include all relevant technical details, explanations, and examples.
Be specific and detailed, providing actionable information that developers can use.`,

    userPromptTemplate: `Create a detailed technical document for the following tech stack:
{techStackFormatted}

{userInstructions}
The document should include:
1. Overview and Purpose
2. Technical Architecture
3. Component Details
4. Implementation Guidelines
5. Best Practices
6. Common Pitfalls and Solutions
7. References and Resources

Format the document in Markdown with clear headings, bullet points, code examples, and tables where appropriate.
Make the content specific, actionable, and tailored to the tech stack components.`,
  },
};

/**
 * Get the system prompt and user prompt template for a specific asset type
 */
export function getAssetPrompt(assetType: string): AssetPrompt {
  return assetPrompts[assetType] || assetPrompts.Default;
}

/**
 * Format the tech stack details for use in prompts
 */
export function formatTechStackDetails(techStackDetails: any): string {
  const techStackName = techStackDetails.name || "Tech Stack";
  return `
Tech Stack Name: ${techStackName}
App Type: ${techStackDetails.appType || "Web Application"}
Frontend: ${techStackDetails.frontEndStack || "React"}
Backend: ${techStackDetails.backendStack || "Node.js"}
Database: ${techStackDetails.database || "SQL"}
Deployment: ${techStackDetails.deploymentStack || "Vercel"}
${techStackDetails.aiAgentStack?.length > 0 ? `AI Technologies: ${techStackDetails.aiAgentStack.join(", ")}` : ""}
${techStackDetails.integrations?.length > 0 ? `Integrations: ${techStackDetails.integrations.join(", ")}` : ""}
${techStackDetails.description ? `Description: ${techStackDetails.description}` : ""}
`;
}

/**
 * Generate the user prompt with tech stack details and user instructions
 */
export function generateUserPrompt(
  assetType: string,
  techStackDetails: any,
  userInstructions?: string
): string {
  const { userPromptTemplate } = getAssetPrompt(assetType);
  const techStackFormatted = formatTechStackDetails(techStackDetails);
  const formattedInstructions = userInstructions
    ? `Additional instructions: ${userInstructions}\n\n`
    : "";

  return userPromptTemplate
    .replace("{techStackFormatted}", techStackFormatted)
    .replace("{userInstructions}", formattedInstructions);
}
