#!/bin/bash

# Set up environment variables if not already set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "OPENAI_API_KEY not set, checking for .env.local file..."
  if [ -f ".env.local" ]; then
    source .env.local
    echo "Environment loaded from .env.local"
  else
    echo "WARNING: No .env.local file found. OPENAI_API_KEY might not be available."
  fi
fi

echo "============================================"
echo "Running document test suite for all formats:"
echo "============================================"

# Create test/data directory if it doesn't exist
mkdir -p ./test/data

# Run tests for each document type
echo "Running PDF document upload test..."
node src/test/test-pdf-upload.js
echo ""

echo "Running TXT document upload test..."
node src/test/test-txt-upload.js
echo ""

echo "Running DOCX document upload test..."
node src/test/test-docx-upload.js
echo ""

echo "Running Markdown document upload test..."
node src/test/test-markdown-upload.js 