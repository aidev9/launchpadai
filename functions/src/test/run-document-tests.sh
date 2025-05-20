#!/bin/bash

# Script to run all document upload tests with proper setup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if emulators are running
if ! curl --silent --fail http://localhost:8081 > /dev/null; then
  echo -e "${RED}Error: Firebase emulators don't appear to be running.${NC}"
  echo -e "${YELLOW}Please start the emulators with 'firebase emulators:start' before running tests.${NC}"
  exit 1
fi

echo -e "${YELLOW}Building functions project...${NC}"
npm run build

echo -e "${YELLOW}Creating test directory for pdf-parse if needed...${NC}"
mkdir -p test/data

# Create an empty PDF file for pdf-parse module
if [ ! -f ./test/data/05-versions-space.pdf ]; then
  echo -e "${YELLOW}Creating mock PDF test file for pdf-parse module...${NC}"
  echo -n "%PDF-1.4" > ./test/data/05-versions-space.pdf
fi

# Install necessary dependencies if they're not already installed
if ! npm list docx >/dev/null 2>&1; then
  echo -e "${YELLOW}Installing docx dependency...${NC}"
  npm install docx
fi

if ! npm list pdfkit >/dev/null 2>&1; then
  echo -e "${YELLOW}Installing pdfkit dependency...${NC}"
  npm install pdfkit
fi

echo -e "${CYAN}=== Test Information ====${NC}"
echo -e "${CYAN}Each document test now includes custom chunkSize and overlap parameters:${NC}"
echo -e "${CYAN}• PDF test: chunkSize=800, overlap=150${NC}"
echo -e "${CYAN}• TXT test: chunkSize=500, overlap=100${NC}"
echo -e "${CYAN}• Markdown test: chunkSize=600, overlap=120${NC}"
echo -e "${CYAN}• DOCX test: chunkSize=750, overlap=180${NC}"
echo -e "${CYAN}These parameters will be used to test the document chunking customization.${NC}\n"

# Run test based on argument or run all tests
if [ -z "$1" ]; then
  echo -e "${CYAN}Running all document tests sequentially...${NC}"
  
  echo -e "\n${MAGENTA}=== Running Markdown document test ====${NC}"
  node src/test/test-markdown-upload.js
  
  echo -e "\n${MAGENTA}=== Running TXT document test ====${NC}"
  node src/test/test-txt-upload.js
  
  echo -e "\n${MAGENTA}=== Running PDF document test ====${NC}"
  node src/test/test-pdf-upload.js
  
  echo -e "\n${MAGENTA}=== Running DOCX document test ====${NC}"
  node src/test/test-docx-upload.js
  
else
  case "$1" in
    md|markdown)
      echo -e "${CYAN}Running Markdown document test...${NC}"
      node src/test/test-markdown-upload.js
      ;;
    txt|text)
      echo -e "${CYAN}Running TXT document test...${NC}"
      node src/test/test-txt-upload.js
      ;;
    pdf)
      echo -e "${CYAN}Running PDF document test...${NC}"
      node src/test/test-pdf-upload.js
      ;;
    docx|doc|word)
      echo -e "${CYAN}Running DOCX document test...${NC}"
      node src/test/test-docx-upload.js
      ;;
    *)
      echo -e "${RED}Unknown test type: $1${NC}"
      echo -e "${YELLOW}Available test types: md, txt, pdf, docx${NC}"
      exit 1
      ;;
  esac
fi

exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo -e "${GREEN}Test(s) completed successfully!${NC}"
else
  echo -e "${RED}Test(s) failed with exit code: $exit_code${NC}"
  echo -e "${YELLOW}Check the Firebase emulator logs for more details.${NC}"
fi

exit $exit_code 