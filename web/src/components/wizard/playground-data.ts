// playground-data.ts
// Dictionary of 10 main categories, each with 10 subcategories and a 300+ word prompt template
// Use variable placeholders for all injected context

export type PlaygroundPromptTemplate = {
  id: string;
  name: string;
  promptTemplate: string;
};

export type PlaygroundCategory = {
  id: string;
  name: string;
  subcategories: PlaygroundPromptTemplate[];
};

export const PLAYGROUND_CATEGORIES: PlaygroundCategory[] = [
  {
    id: "marketing",
    name: "Marketing",
    subcategories: [
      {
        id: "launch-plan",
        name: "Launch Plan",
        promptTemplate: `You are a world-class marketing strategist. Create a detailed, actionable launch plan for the following product: \n\nProduct: {{productName}}\nDescription: {{productDescription}}\nPhases: {{productPhases}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nYour plan should cover pre-launch, launch, and post-launch activities. Identify the target audience, key messaging, all relevant marketing channels (digital, social, PR, events, partnerships, etc.), timeline, resource needs, and clear success metrics. For each phase, specify the objective, tactics, expected outcomes, and how results will be measured. Consider the competitive landscape, unique value proposition, and any constraints from the business or tech stack. The plan should be at least 300 words and serve as a blueprint for the team to execute successfully.`
      },
      {
        id: "content-calendar",
        name: "Content Calendar",
        promptTemplate: `You are a senior content marketer. Build a 3-month content calendar for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude blog posts, social media, email, webinars, and any other channels relevant to the stack. For each week, specify content themes, titles, responsible roles, distribution channels, and KPIs. Explain how each piece aligns with the product’s positioning and business goals. Be thorough and strategic, providing at least 300 words of actionable detail.`
      },
      {
        id: "persona-development",
        name: "Persona Development",
        promptTemplate: `You are an expert in customer research. Develop 3 detailed personas for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nPhases: {{productPhases}}\nBusiness Stack: {{businessStack}}\n\nFor each persona, specify demographics, psychographics, needs, pain points, buying triggers, and preferred channels. Use insights from the business and tech stack to tailor the personas. Each persona should be at least 100 words, for a total of 300+ words.`
      },
      {
        id: "email-sequence",
        name: "Email Sequence",
        promptTemplate: `You are a SaaS email marketing specialist. Write a 5-part launch email sequence for: \n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nFor each email, provide subject, preview, body copy, CTA, and timing. Ensure the sequence addresses awareness, education, conversion, onboarding, and retention. Each email should be tailored to the stack and audience, and the total output should be at least 300 words.`
      },
      {
        id: "social-media-campaign",
        name: "Social Media Campaign",
        promptTemplate: `You are a social media strategist. Design a 6-week campaign for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nOutline weekly themes, post types, platform choices, influencer partnerships, KPIs, and engagement tactics, referencing the business and tech stack. Provide at least 300 words of actionable detail.`
      },
      {
        id: "seo-strategy",
        name: "SEO Strategy",
        promptTemplate: `You are an SEO expert. Develop a comprehensive SEO strategy for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude keyword research, on-page, off-page, and technical SEO, content plan, and success metrics. Reference the business and tech stack for technical constraints or opportunities. Output should be at least 300 words.`
      },
      {
        id: "ad-campaign",
        name: "Ad Campaign",
        promptTemplate: `You are a digital ads specialist. Create a multi-channel ad campaign for: \n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude creative concepts, targeting, platforms, budget allocation, and measurement plan. Address how the stack impacts tracking or creative. At least 300 words.`
      },
      {
        id: "brand-positioning",
        name: "Brand Positioning",
        promptTemplate: `You are a brand strategist. Articulate a clear brand positioning statement for: \n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude target audience, frame of reference, key benefit, and reason to believe. Explain how the business and tech stack support the positioning. Provide at least 300 words of rationale and messaging guidance.`
      },
      {
        id: "press-release",
        name: "Press Release",
        promptTemplate: `You are a PR expert. Write a launch press release for: \n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude headline, subheader, body, quotes, and boilerplate. Tailor the narrative to the business and tech stack. At least 300 words.`
      },
      {
        id: "customer-journey-map",
        name: "Customer Journey Map",
        promptTemplate: `You are a CX specialist. Map the full customer journey for: \n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nIdentify all touchpoints, pain points, opportunities, and handoffs across awareness, consideration, purchase, onboarding, and retention. Use at least 300 words and reference how the stack impacts the experience.`
      }
    ]
  },

  // ENGINEERING
  {
    id: "engineering",
    name: "Engineering",
    subcategories: [
      {
        id: "system-architecture",
        name: "System Architecture",
        promptTemplate: `You are a senior software architect. Design a scalable, robust system architecture for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nPhases: {{productPhases}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nYour architecture should include a detailed breakdown of all major components, their responsibilities, and how they interact. Describe the data flow, integration points, and any third-party dependencies. Address scalability, reliability, and security, referencing how the business and tech stack influence your decisions. Include a migration or evolution path for future phases. Provide at least 300 words of actionable, technical detail that can be used by the engineering team as a blueprint.`
      },
      {
        id: "api-design",
        name: "API Design",
        promptTemplate: `You are an API designer. Create a RESTful API specification for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nList all endpoints, HTTP methods, request and response schemas, and authentication mechanisms. Explain how the API integrates with the business and tech stack. Address error handling, rate limiting, and documentation standards. The output should be at least 300 words and ready for review by the backend team.`
      },
      {
        id: "code-review-checklist",
        name: "Code Review Checklist",
        promptTemplate: `You are a lead engineer. Draft a comprehensive code review checklist for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nCover readability, maintainability, security, performance, and alignment with the tech stack. Include examples and rationale for each item. The checklist should be at least 300 words and actionable for reviewers.`
      },
      {
        id: "deployment-plan",
        name: "Deployment Plan",
        promptTemplate: `You are a DevOps specialist. Create a deployment plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude CI/CD pipeline steps, environment setup, rollback strategies, and monitoring. Explain how the plan supports the business and tech stack. Provide at least 300 words of actionable guidance for the engineering and operations teams.`
      },
      {
        id: "performance-optimization",
        name: "Performance Optimization",
        promptTemplate: `You are a performance engineer. Recommend optimizations for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nAnalyze bottlenecks, suggest improvements, and explain how each change impacts the user experience and business stack. Provide at least 300 words of technical guidance, including code or configuration examples where relevant.`
      },
      {
        id: "security-review",
        name: "Security Review",
        promptTemplate: `You are an application security expert. Conduct a security review for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nIdentify vulnerabilities, recommend mitigations, and explain how the security posture aligns with the business and tech stack. Provide at least 300 words of actionable detail, referencing standards such as OWASP where appropriate.`
      },
      {
        id: "migration-strategy",
        name: "Migration Strategy",
        promptTemplate: `You are a cloud migration consultant. Develop a migration strategy for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nDescribe phases, risks, required tools, and how the migration supports the business and tech stack. Provide at least 300 words of actionable guidance, including a high-level timeline and risk mitigation plan.`
      },
      {
        id: "test-plan",
        name: "Test Plan",
        promptTemplate: `You are a QA lead. Create a test plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude test types, coverage, tools, and how testing aligns with the business and tech stack. Provide at least 300 words of actionable detail, including acceptance criteria and reporting standards.`
      },
      {
        id: "incident-response",
        name: "Incident Response",
        promptTemplate: `You are an SRE. Write an incident response plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude detection, escalation, communication, and recovery steps. Tailor the plan to the business and tech stack. Provide at least 300 words of actionable guidance for the team.`
      },
      {
        id: "documentation-outline",
        name: "Documentation Outline",
        promptTemplate: `You are a technical writer. Draft a documentation outline for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude user guides, API docs, onboarding, and troubleshooting. Explain how documentation supports the business and tech stack. Provide at least 300 words of detail and structure.`
      }
    ]
  },

  // CODING
  {
    id: "development",
    name: "Development",
    subcategories: [
      {
        id: "feature-implementation",
        name: "Feature Implementation",
        promptTemplate: `You are a senior developer. Implement the following feature for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "bug-fix",
        name: "Bug Fix",
        promptTemplate: `You are a software engineer. Diagnose and fix the following bug for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBug: [Describe the bug]\nTech Stack: {{techStack}}\n\nProvide a step-by-step solution, code samples, and explain how the fix aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "refactoring",
        name: "Refactoring",
        promptTemplate: `You are a code quality expert. Refactor the following module for better readability, maintainability, and performance.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nModule: [Describe the module]\nTech Stack: {{techStack}}\n\nProvide before/after code snippets, explain design choices, and ensure alignment with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "unit-testing",
        name: "Unit Testing",
        promptTemplate: `You are a test automation engineer. Write unit tests for the following component or function.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nComponent: [Describe the component]\nTech Stack: {{techStack}}\n\nProvide test cases, code samples, and explain how the tests align with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "code-review-feedback",
        name: "Code Review Feedback",
        promptTemplate: `You are a code reviewer. Provide feedback on the following code submission.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\nSubmission: [Paste the code]\n\nHighlight strengths, weaknesses, and suggest improvements. Ensure feedback is actionable and aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "integration-testing",
        name: "Integration Testing",
        promptTemplate: `You are a QA engineer. Write integration tests for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nDescribe test scenarios, provide code samples, and explain how the tests align with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "performance-benchmarking",
        name: "Performance Benchmarking",
        promptTemplate: `You are a performance engineer. Benchmark the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nDescribe metrics, tools, and provide actionable recommendations. The output should be at least 300 words and tailored to the tech stack.`
      },
      {
        id: "ci-cd-pipeline",
        name: "CI/CD Pipeline",
        promptTemplate: `You are a DevOps engineer. Design a CI/CD pipeline for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nDescribe stages, tools, and explain how the pipeline supports the tech stack. Provide at least 300 words of actionable detail.`
      },
      {
        id: "documentation-generation",
        name: "Documentation Generation",
        promptTemplate: `You are a documentation specialist. Generate technical documentation for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude code samples, usage guides, and explain how the documentation supports the tech stack. The output should be at least 300 words.`
      },
      {
        id: "open-source-prep",
        name: "Open Source Prep",
        promptTemplate: `You are an open-source expert. Prepare the following product for open source release.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nDescribe licensing, documentation, community guidelines, and how the release aligns with the tech stack. Provide at least 300 words of actionable detail.`
      }
    ]
  },
  // VIBE CODING
  {
    id: "vibe-coding",
    name: "Vibe Coding",
    subcategories: [
      {
        id: "coding-standards",
        name: "Coding Standards",
        promptTemplate: `You are a coding standards expert. Define the core coding standards for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\n\nInclude descriptions, examples, and explain how they support the business stack. The output should be at least 300 words.`
      },
      {
        id: "code-review-feedback",
        name: "Code Review Feedback",
        promptTemplate: `You are a code reviewer. Provide feedback on the following code submission.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\nSubmission: [Paste the code]\n\nHighlight strengths, weaknesses, and suggest improvements. Ensure feedback is actionable and aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "code-feature-implementation",
        name: "Code Feature Implementation",
        promptTemplate: `You are a senior developer. Implement the following feature for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "code-ui-feature",
        name: "Code UI Feature",
        promptTemplate: `You are a senior full-stack developer. Implement the following UI feature for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "code-backend-feature",
        name: "Code Backend Feature",
        promptTemplate: `You are a senior full-stack developer. Implement the following backend feature for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "code-full-stack-feature",
        name: "Code Full Stack Feature",
        promptTemplate: `You are a senior full-stack developer. Implement the following full stack feature for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "code-ai-agent",
        name: "Code AI Agent",
        promptTemplate: `You are a seniorAI agent. Implement the following full stack feature for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "feedback-framework",
        name: "Feedback Framework",
        promptTemplate: `You are a leadership coach. Create a feedback framework for the following product team.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\n\nDescribe processes, tools, and how the framework supports the business stack and team growth. The output should be at least 300 words.`
      },
      {
        id: "refactor-legacy-code",
        name: "Refactor Legacy Code",
        promptTemplate: `You are a senior developer. Refactor the following legacy code for the product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "create-test-automation",
        name: "Create Test Automation",
        promptTemplate: `You are a senior developer. Create test automation for the following product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "create-ci-cd-pipeline",
        name: "Create CI/CD Pipeline",
        promptTemplate: `You are a senior developer. Create a CI/CD pipeline for the following product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "solve-technical-debt",
        name: "Solve Technical Debt",
        promptTemplate: `You are a senior developer. Resolve technical debt for the following product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "resolve-merge-conflicts",
        name: "Resolve Merge Conflicts",
        promptTemplate: `You are a senior developer. Resolve merge conflicts for the following product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      },
      {
        id: "debug-production-logs",
        name: "Debug Production Logs",
        promptTemplate: `You are a senior developer. Debug production logs for the following product below.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nFeature: [Describe the feature]\nTech Stack: {{techStack}}\n\nProvide code samples, explain design decisions, and ensure alignment with the tech stack. The output should be at least 300 words and production-ready.`
      }
    ]
  },

  // LEGAL
  {
    id: "legal",
    name: "Legal",
    subcategories: [
      {
        id: "terms-conditions",
        name: "Terms & Conditions",
        promptTemplate: `You are a legal counsel. Draft terms and conditions for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude user rights, responsibilities, and how the terms align with the business and tech stack. The output should be at least 300 words and ready for legal review.`
      },
      {
        id: "privacy-policy",
        name: "Privacy Policy",
        promptTemplate: `You are a privacy expert. Write a privacy policy for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude data collection, usage, storage, and how the policy aligns with the business and tech stack. The output should be at least 300 words and ready for legal review.`
      },
      {
        id: "ip-protection",
        name: "IP Protection",
        promptTemplate: `You are an IP lawyer. Advise on intellectual property protection for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nDescribe patents, trademarks, copyrights, and how protection aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "compliance-checklist",
        name: "Compliance Checklist",
        promptTemplate: `You are a compliance officer. Create a compliance checklist for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude regulations, standards, and how compliance aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "contract-template",
        name: "Contract Template",
        promptTemplate: `You are a contracts lawyer. Draft a contract template for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude parties, terms, and how the contract aligns with the business and tech stack. The output should be at least 300 words and ready for legal review.`
      },
      {
        id: "risk-assessment",
        name: "Risk Assessment",
        promptTemplate: `You are a risk manager. Conduct a legal risk assessment for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nIdentify risks, mitigation strategies, and how risk management aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "user-agreement",
        name: "User Agreement",
        promptTemplate: `You are a legal writer. Draft a user agreement for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude terms, responsibilities, and how the agreement aligns with the business and tech stack. The output should be at least 300 words and ready for legal review.`
      },
      {
        id: "gdpr-guidance",
        name: "GDPR Guidance",
        promptTemplate: `You are a GDPR consultant. Advise on GDPR compliance for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nDescribe requirements, steps, and how GDPR aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "data-breach-response",
        name: "Data Breach Response",
        promptTemplate: `You are a cybersecurity lawyer. Write a data breach response plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude detection, notification, and how the plan aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "terms-update-notice",
        name: "Terms Update Notice",
        promptTemplate: `You are a legal communicator. Draft a terms update notice for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nExplain changes, user impact, and how the notice aligns with the business and tech stack. The output should be at least 300 words.`
      }
    ]
  },

  // SALES
  {
    id: "sales",
    name: "Sales",
    subcategories: [
      {
        id: "sales-pitch",
        name: "Sales Pitch",
        promptTemplate: `You are a sales leader. Write a sales pitch for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nHighlight value proposition, address objections, and ensure alignment with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "demo-script",
        name: "Demo Script",
        promptTemplate: `You are a sales engineer. Draft a demo script for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude product features, benefits, and how the demo aligns with the business and tech stack. Provide at least 300 words of actionable detail.`
      },
      {
        id: "objection-handling",
        name: "Objection Handling",
        promptTemplate: `You are a sales trainer. Create an objection handling guide for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nList common objections, responses, and how they align with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "pricing-strategy",
        name: "Pricing Strategy",
        promptTemplate: `You are a pricing strategist. Develop a pricing strategy for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude tiers, positioning, and how the strategy aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "customer-journey",
        name: "Customer Journey",
        promptTemplate: `You are a customer journey expert. Map the customer journey for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude touchpoints, pain points, and how the journey aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "lead-qualification",
        name: "Lead Qualification",
        promptTemplate: `You are a sales operations manager. Create a lead qualification framework for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nDefine criteria, scoring, and how the framework aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "account-management",
        name: "Account Management",
        promptTemplate: `You are an account manager. Develop an account management plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude relationship building, upsell strategies, and how the plan aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "sales-enablement",
        name: "Sales Enablement",
        promptTemplate: `You are a sales enablement specialist. Create a sales enablement toolkit for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude training materials, playbooks, and how the toolkit supports the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "proposal-template",
        name: "Proposal Template",
        promptTemplate: `You are a proposal writer. Draft a proposal template for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude sections, content guidelines, and how the template aligns with the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "closing-strategies",
        name: "Closing Strategies",
        promptTemplate: `You are a sales closer. List closing strategies for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nDescribe tactics, timing, and how strategies align with the business and tech stack. The output should be at least 300 words.`
      }
    ]
  },

  // GOVERNMENT
  {
    id: "government",
    name: "Government",
    subcategories: [
      {
        id: "policy-brief",
        name: "Policy Brief",
        promptTemplate: `You are a policy analyst. Write a policy brief for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nSummarize the issue, proposed solution, stakeholders, and how the product aligns with government priorities. The output should be at least 300 words.`
      },
      {
        id: "grant-application",
        name: "Grant Application",
        promptTemplate: `You are a grant writer. Draft a grant application for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude objectives, budget, and how the product supports public goals. The output should be at least 300 words.`
      },
      {
        id: "regulatory-compliance",
        name: "Regulatory Compliance",
        promptTemplate: `You are a compliance officer. Create a regulatory compliance checklist for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nList relevant regulations, steps for compliance, and how they relate to the business and tech stack. The output should be at least 300 words.`
      },
      {
        id: "public-communication",
        name: "Public Communication",
        promptTemplate: `You are a communications director. Draft a public communication plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude channels, messaging, and how the plan supports transparency and public trust. The output should be at least 300 words.`
      },
      {
        id: "stakeholder-analysis",
        name: "Stakeholder Analysis",
        promptTemplate: `You are a government relations specialist. Conduct a stakeholder analysis for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nIdentify key stakeholders, their interests, and how the product impacts them. The output should be at least 300 words.`
      },
      {
        id: "impact-report",
        name: "Impact Report",
        promptTemplate: `You are a public sector evaluator. Write an impact report for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nAssess outcomes, metrics, and how the product supports government goals. The output should be at least 300 words.`
      },
      {
        id: "procurement-strategy",
        name: "Procurement Strategy",
        promptTemplate: `You are a procurement officer. Develop a procurement strategy for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nInclude sourcing, evaluation, and how the strategy aligns with government standards. The output should be at least 300 words.`
      },
      {
        id: "legislative-briefing",
        name: "Legislative Briefing",
        promptTemplate: `You are a legislative aide. Prepare a legislative briefing for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nSummarize key points, implications, and how the product relates to policy. The output should be at least 300 words.`
      },
      {
        id: "public-feedback-plan",
        name: "Public Feedback Plan",
        promptTemplate: `You are a civic engagement expert. Create a public feedback plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nDescribe methods, tools, and how feedback will be incorporated. The output should be at least 300 words.`
      },
      {
        id: "risk-management",
        name: "Risk Management",
        promptTemplate: `You are a risk manager. Develop a risk management plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nBusiness Stack: {{businessStack}}\nTech Stack: {{techStack}}\n\nIdentify risks, mitigation strategies, and how the plan supports government objectives. The output should be at least 300 words.`
      }
    ]
  },

  // NON-PROFIT
  {
    id: "nonprofit",
    name: "Non-Profit",
    subcategories: [
      {
        id: "mission-statement",
        name: "Mission Statement",
        promptTemplate: `You are a non-profit strategist. Write a mission statement for the following organization.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude core values, vision, and how the mission aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "grant-proposal",
        name: "Grant Proposal",
        promptTemplate: `You are a grant writer. Draft a grant proposal for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude objectives, budget, and how the proposal supports the mission. The output should be at least 300 words.`
      },
      {
        id: "impact-report",
        name: "Impact Report",
        promptTemplate: `You are an evaluator. Write an impact report for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nAssess outcomes, metrics, and how the work supports the mission. The output should be at least 300 words.`
      },
      {
        id: "volunteer-handbook",
        name: "Volunteer Handbook",
        promptTemplate: `You are a volunteer coordinator. Create a volunteer handbook for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude policies, expectations, and how the handbook supports the mission. The output should be at least 300 words.`
      },
      {
        id: "donor-outreach",
        name: "Donor Outreach",
        promptTemplate: `You are a fundraising specialist. Write a donor outreach plan for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude messaging, channels, and how the plan supports the mission. The output should be at least 300 words.`
      },
      {
        id: "annual-report",
        name: "Annual Report",
        promptTemplate: `You are a communications director. Draft an annual report for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude achievements, financials, and how the report supports the mission. The output should be at least 300 words.`
      },
      {
        id: "board-recruitment",
        name: "Board Recruitment",
        promptTemplate: `You are a governance expert. Develop a board recruitment strategy for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude criteria, outreach, and how the strategy supports the mission. The output should be at least 300 words.`
      },
      {
        id: "community-engagement",
        name: "Community Engagement",
        promptTemplate: `You are a community organizer. Create a community engagement plan for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude activities, partnerships, and how the plan supports the mission. The output should be at least 300 words.`
      },
      {
        id: "program-evaluation",
        name: "Program Evaluation",
        promptTemplate: `You are a program evaluator. Evaluate a program for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude goals, metrics, and how the evaluation supports the mission. The output should be at least 300 words.`
      },
      {
        id: "advocacy-campaign",
        name: "Advocacy Campaign",
        promptTemplate: `You are an advocacy expert. Plan an advocacy campaign for the following non-profit.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude objectives, tactics, and how the campaign supports the mission. The output should be at least 300 words.`
      }
    ]
  },

  // PRODUCT
  {
    id: "product",
    name: "Product",
    subcategories: [
      {
        id: "product-roadmap",
        name: "Product Roadmap",
        promptTemplate: `You are a product manager. Create a product roadmap for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude milestones, phases, and how the roadmap aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "feature-prioritization",
        name: "Feature Prioritization",
        promptTemplate: `You are a product strategist. Prioritize features for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude criteria, scoring, and how prioritization aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "user-story-mapping",
        name: "User Story Mapping",
        promptTemplate: `You are an agile coach. Create a user story map for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude epics, stories, and how mapping aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "go-to-market",
        name: "Go-To-Market",
        promptTemplate: `You are a GTM strategist. Develop a go-to-market plan for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude channels, messaging, and how the plan aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "user-feedback-loop",
        name: "User Feedback Loop",
        promptTemplate: `You are a UX researcher. Design a user feedback loop for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude methods, analysis, and how the loop aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "product-metrics-dashboard",
        name: "Product Metrics Dashboard",
        promptTemplate: `You are a data analyst. Build a product metrics dashboard for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude KPIs, tools, and how the dashboard aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "beta-launch-plan",
        name: "Beta Launch Plan",
        promptTemplate: `You are a launch manager. Plan a beta launch for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude timeline, goals, and how the plan aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "product-positioning",
        name: "Product Positioning",
        promptTemplate: `You are a product marketer. Define product positioning for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude messaging, differentiation, and how positioning aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "pricing-model",
        name: "Pricing Model",
        promptTemplate: `You are a pricing analyst. Develop a pricing model for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude tiers, rationale, and how the model aligns with the tech stack. The output should be at least 300 words.`
      },
      {
        id: "release-notes",
        name: "Release Notes",
        promptTemplate: `You are a release manager. Write release notes for the following product.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTech Stack: {{techStack}}\n\nInclude changes, impact, and how the notes align with the tech stack. The output should be at least 300 words.`
      }
    ]
  },

  // STARTUPS
  {
    id: "startups",
    name: "Startups",
    subcategories: [
      {
        id: "pitch-deck",
        name: "Pitch Deck",
        promptTemplate: `You are a startup mentor. Create a pitch deck for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude slides, key messages, and how the deck aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "founder-story",
        name: "Founder Story",
        promptTemplate: `You are a storyteller. Write a founder story for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude background, motivation, and how the story aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "investor-faq",
        name: "Investor FAQ",
        promptTemplate: `You are an investor relations expert. Write an investor FAQ for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude questions, answers, and how the FAQ aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "market-entry-plan",
        name: "Market Entry Plan",
        promptTemplate: `You are a market strategist. Develop a market entry plan for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude steps, risks, and how the plan aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "cap-table-template",
        name: "Cap Table Template",
        promptTemplate: `You are a finance expert. Create a cap table template for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude structure, sample data, and how the template aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "startup-metrics-dashboard",
        name: "Startup Metrics Dashboard",
        promptTemplate: `You are a startup analyst. Build a metrics dashboard for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude KPIs, tools, and how the dashboard aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "fundraising-strategy",
        name: "Fundraising Strategy",
        promptTemplate: `You are a fundraising strategist. Develop a fundraising strategy for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude sources, tactics, and how the strategy aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "early-adopter-program",
        name: "Early Adopter Program",
        promptTemplate: `You are a customer success manager. Design an early adopter program for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude benefits, requirements, and how the program aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "startup-advisor-list",
        name: "Startup Advisor List",
        promptTemplate: `You are a networking expert. Build a startup advisor list for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude roles, bios, and how the list aligns with the audience. The output should be at least 300 words.`
      },
      {
        id: "exit-strategy",
        name: "Exit Strategy",
        promptTemplate: `You are a startup consultant. Develop an exit strategy for the following startup.\n\nProduct: {{productName}}\nDescription: {{productDescription}}\nTarget Audience: {{targetAudience}}\n\nInclude options, timing, and how the strategy aligns with the audience. The output should be at least 300 words.`
      }
    ]
  }
]
;

