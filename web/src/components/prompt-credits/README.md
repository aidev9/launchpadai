# LaunchpadAI Prompt Credits System

This module implements the prompt credit system for LaunchpadAI, which enables users to access AI features with a credit-based system.

## Features

- Credit allocation based on subscription plans
- Daily refill for free users
- Monthly refill for paid subscriptions
- Credit usage tracking
- Credit purchase options
- Low-balance warning notifications

## AI Features That Use Prompt Credits

Each of the following AI features consumes one prompt credit per use:

1. **AI Naming Assistant** - Helps users find the perfect name for their startup or product by interacting through a chat interface

   - Located in `/tools/naming-assistant`
   - Each prompt sent to the naming assistant consumes one credit

2. **General Chat Assistant** - LaunchpadAI's built-in AI chatbot accessible via the ChatWidget component

   - Each user message sent to the assistant consumes one credit
   - Helps users with platform features and startup guidance

3. **Prompt Enhancer** - Improves user-written prompts to make them more effective for AI tools

   - Located in `/prompts/prompt`
   - Each enhancement request consumes one credit

4. **Asset Generation** - AI-powered generation of business and marketing assets
   - Located in `/assets/generate`
   - Generates logos, images, social media content, and marketing copy
   - Each generation request consumes one credit

## Credit Allocation by Plan

- **Free Plan**: 10 daily credits, reset each day
- **Explorer Plan**: 300 monthly credits, reset each month
- **Builder Plan**: 600 monthly credits, reset each month
- **Enterprise Plan**: 900 monthly credits, reset each month

## Additional Credit Packs

Users can purchase additional credit packs:

- 300 prompt credits for $19
- 600 prompt credits for $29
- 900 prompt credits for $39

## Technical Implementation

### Data Model

The system uses the following Firestore collections:

- `prompt_credits` - Stores user credit balances and usage stats
- `prompt_credit_purchases` - Records purchase history for additional credits

### Components

- `CreditBalance` - Displays user's remaining credits and warnings
- `CreditPurchase` - Interface for buying additional credit packs
- `LowCreditAlert` - Warning when credits fall below threshold

### Server Actions

- `initializePromptCredits` - Sets up initial credits for new users
- `getPromptCredits` - Retrieves user's current credit status
- `usePromptCredit` - Consumes one credit for an AI feature
- `addPromptCredits` - Adds credits after purchase or subscription change
- `recordPromptPackPurchase` - Records purchase transactions
