#!/bin/bash

# Script to run the PDF upload test with proper setup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building functions project...${NC}"
npm run build

echo -e "${YELLOW}Creating test directory for pdf-parse if needed...${NC}"
mkdir -p test/data

# Create an empty PDF file for pdf-parse module
if [ ! -f ./test/data/05-versions-space.pdf ]; then
  echo -e "${YELLOW}Creating mock PDF test file for pdf-parse module...${NC}"
  echo -n "%PDF-1.4" > ./test/data/05-versions-space.pdf
fi

echo -e "${GREEN}Running PDF upload test...${NC}"
node src/test/test-pdf-upload.js

exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo -e "${GREEN}Test completed successfully!${NC}"
else
  echo -e "${RED}Test failed with exit code: $exit_code${NC}"
  echo -e "${YELLOW}Check the Firebase emulator logs for more details.${NC}"
fi

exit $exit_code 