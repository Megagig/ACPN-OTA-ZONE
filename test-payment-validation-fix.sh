#!/bin/bash

# Test script for the payment form validation fix
# This script checks if the frontend server is running and then opens the payment form

echo "=== Payment Form Validation Test Script ==="
echo "Date: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if frontend server is running
echo -e "${YELLOW}Checking if frontend server is running...${NC}"
if ! curl -s http://localhost:5173 > /dev/null; then
  echo -e "${RED}Frontend server is not running. Please start it with 'npm run dev' in the frontend directory.${NC}"
  exit 1
fi

echo -e "${GREEN}Frontend server is running.${NC}"
echo ""

# Provide instructions
echo -e "${YELLOW}Instructions to test the payment form validation fix:${NC}"
echo "1. Navigate to http://localhost:5173/my-dues"
echo "2. Log in with your credentials if prompted"
echo "3. Click 'Pay Now' on a due with a balance > 0"
echo "4. Try entering different payment amounts to test the validation:"
echo "   - Amount less than 0.01 should be automatically adjusted to 0.01"
echo "   - Amount greater than the due balance should be automatically adjusted to the due balance"
echo "   - The form now shows validation feedback for both minimum and maximum values"
echo ""

echo -e "${YELLOW}Would you like to open the page in your browser? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:5173/my-dues"
  elif command -v open > /dev/null; then
    open "http://localhost:5173/my-dues"
  else
    echo -e "${RED}Could not automatically open browser. Please navigate to http://localhost:5173/my-dues manually.${NC}"
  fi
fi

echo ""
echo -e "${GREEN}Test script complete!${NC}"
