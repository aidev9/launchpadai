# Document Processing Testing Guide

This guide explains how to test the document processing functionality which generates embeddings for documents uploaded to Firebase Storage.

## Prerequisites

1. Node.js and npm/pnpm installed
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Firebase project set up and configured
4. OpenAI API key
5. NeonDB connection string (for production testing)

## Environment Setup

Create a `.env.local` file in the root of your project with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
NEON_DB_CONNECTION_STRING=your_neondb_connection_string
```

## Running the Tests

### Step 1: Start the Firebase Emulators

```bash
firebase emulators:start
```

This will start all the necessary emulators, including Functions and Firestore.

### Step 2: Run the Test Script

```bash
cd functions
./test-document-processing.sh
```

This script will:

1. Create a sample Markdown document
2. Upload it to the Firebase Storage emulator
3. Create the necessary Firestore documents
4. Monitor the document processing status to verify the function works

## What's Being Tested

The test verifies the entire document processing pipeline:

1. Storage trigger function activation
2. File type validation
3. Text extraction
4. Text chunking
5. OpenAI embedding generation
6. Keyword extraction
7. Storing embeddings and metadata in the database
8. Updating document status in Firestore

## Troubleshooting

### Firebase Emulator Connection Issues

Make sure the emulators are running on the default ports:

- Functions: 5001
- Firestore: 8080
- Storage: 9199
- Emulator UI: 4000

### OpenAI API Issues

- Check that your API key is valid and has sufficient credits
- For testing, you can use a mock API key, but embedding generation will fail

### Database Connection Issues

- For local testing, the database operations might fail but the function should still run
- To fully test the database operations, provide a valid NeonDB connection string

## Production Deployment

To deploy the functions to production:

```bash
firebase deploy --only functions
```

## Schema Setup for NeonDB

Run the SQL schema file to create the necessary tables in your NeonDB database:

```sql
-- See functions/src/storage/sql/neon-document-chunks-schema.sql
```
