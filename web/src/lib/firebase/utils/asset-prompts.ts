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
    systemPrompt: `You are an expert software architect tasked with creating a comprehensive Architecture Overview document for a software project.
Your document should outline the system architecture, components, data flow, and technical decisions in detail.
Use Markdown formatting to create a professional document with clear sections and diagrams described in text.
Focus on providing a clear understanding of how the system components interact and the rationale behind architectural decisions.`,

    userPromptTemplate: `Create a detailed Architecture Overview document for the following tech stack:
{techStackFormatted}

{userInstructions}
The document should include:
1. System Overview and Context
2. Architectural Style and Patterns
3. Component Breakdown
4. Data Flow and Communication
5. Database Schema Design
6. API Design
7. Security Architecture
8. Scalability and Performance Considerations
9. Deployment Architecture
10. Technology Choices and Rationale

Format the document in Markdown with clear headings, bullet points, and tables where appropriate.`,
  },

  Tasks: {
    systemPrompt: `You are an expert project manager tasked with creating a comprehensive Development Tasks document for a software project.
Your document should break down the project into clear, actionable tasks organized by area (frontend, backend, database, etc.).
Use Markdown formatting to create a professional document with clear sections and task lists.
Each task should be specific, measurable, and include acceptance criteria where appropriate.`,

    userPromptTemplate: `Create a detailed Development Tasks document for the following tech stack:
{techStackFormatted}

{userInstructions}
The document should include:
1. Project Setup Tasks
2. Frontend Development Tasks
3. Backend Development Tasks
4. Database Setup and Migration Tasks
5. API Development Tasks
6. Authentication and Authorization Tasks
7. Testing Tasks
8. Deployment and DevOps Tasks
9. Documentation Tasks
10. Quality Assurance Tasks

For each task area, provide specific, actionable tasks with clear acceptance criteria.
Format the document in Markdown with clear headings, bullet points, and task lists.`,
  },

  Rules: {
    systemPrompt: `You are an expert technical lead tasked with creating a comprehensive Development Rules document for a software project.
Your document should outline coding standards, best practices, workflow rules, and quality expectations.
Use Markdown formatting to create a professional document with clear sections and examples.
Focus on providing clear, actionable guidelines that will ensure code quality and team consistency.`,

    userPromptTemplate: `Create a detailed Development Rules document for the following tech stack:
{techStackFormatted}

{userInstructions}
The document should include:
1. Code Style and Formatting Rules
2. Git Workflow and Branch Strategy
3. Pull Request and Code Review Process
4. Testing Requirements and Coverage Expectations
5. Documentation Standards
6. Security Best Practices
7. Performance Optimization Guidelines
8. Error Handling and Logging Standards
9. Dependency Management Rules
10. Deployment and Release Process

Format the document in Markdown with clear headings, bullet points, and examples where appropriate.`,
  },

  Prompt: {
    systemPrompt: `You are an expert AI prompt engineer tasked with creating a comprehensive AI Prompt document for a software project.
Your document should provide clear instructions for AI tools to assist in developing the specified application.
Use Markdown formatting to create a professional document with clear sections and examples.
The prompt should be detailed enough that an AI assistant could help develop significant portions of the application.`,

    userPromptTemplate: `Create a detailed AI Prompt document that could be used with AI coding assistants to help develop an application with the following tech stack:
{techStackFormatted}

{userInstructions}
The document should:
1. Start with a clear system instruction defining the AI's role and expertise
2. Provide comprehensive context about the application and its requirements
3. Include specific instructions for generating code for different components
4. Specify coding standards and patterns to follow
5. Include examples of expected input/output formats
6. Provide guidance on error handling, testing, and documentation
7. Include instructions for explaining architectural decisions

Format the document in Markdown with clear headings, code blocks, and examples where appropriate.`,
  },

  Default: {
    systemPrompt: `You are an expert technical writer tasked with creating a comprehensive document for a software project.
Your document should be well-structured, informative, and follow industry best practices.
Use Markdown formatting to create a professional document with clear sections.`,

    userPromptTemplate: `Create a detailed document for the following tech stack:
{techStackFormatted}

{userInstructions}
The document should include relevant information about the tech stack, its components, and how they work together.
Format the document in Markdown with clear headings, bullet points, and examples where appropriate.`,
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
