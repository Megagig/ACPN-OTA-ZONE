#!/bin/bash

# Test script for verifying the due assignment duplicate key error fix
# This script will attempt to assign the same due to the same pharmacy multiple times
# With the fix, subsequent assignments should update the existing due instead of failing

echo "=== Due Assignment Fix Test Script ==="
echo "Date: $(date)"
echo ""

# Set variables
BACKEND_URL="http://localhost:5000/api"
AUTH_EMAIL="admin@example.com"  # Replace with a valid admin user
AUTH_PASSWORD="password123"     # Replace with the correct password
TEST_PHARMACY_ID=""             # Will be populated from API response
TEST_DUE_TYPE_ID=""             # Will be populated from API response

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Step 1: Login to get authentication token
echo -e "${YELLOW}Authenticating...${NC}"
AUTH_RESPONSE=$(curl -s -X POST $BACKEND_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$AUTH_EMAIL\", \"password\": \"$AUTH_PASSWORD\"}")

# Extract token
TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Authentication failed. Please check your credentials.${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}Authentication successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get a pharmacy ID for testing
echo -e "${YELLOW}Fetching a pharmacy for testing...${NC}"
PHARMACIES_RESPONSE=$(curl -s $BACKEND_URL/pharmacies \
  -H "Authorization: Bearer $TOKEN")

# Try to extract the first pharmacy ID
TEST_PHARMACY_ID=$(echo $PHARMACIES_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')

if [ -z "$TEST_PHARMACY_ID" ]; then
  echo -e "${RED}Failed to get a pharmacy ID. Please check if there are pharmacies in the database.${NC}"
  echo "Response: ${PHARMACIES_RESPONSE:0:200}..."
  exit 1
fi

echo -e "${GREEN}Found pharmacy ID: $TEST_PHARMACY_ID${NC}"
echo ""

# Step 3: Get a due type ID for testing
echo -e "${YELLOW}Fetching a due type for testing...${NC}"
DUE_TYPES_RESPONSE=$(curl -s $BACKEND_URL/due-types \
  -H "Authorization: Bearer $TOKEN")

# Try to extract the first due type ID
TEST_DUE_TYPE_ID=$(echo $DUE_TYPES_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')

if [ -z "$TEST_DUE_TYPE_ID" ]; then
  echo -e "${RED}Failed to get a due type ID. Please check if there are due types in the database.${NC}"
  echo "Response: ${DUE_TYPES_RESPONSE:0:200}..."
  exit 1
fi

echo -e "${GREEN}Found due type ID: $TEST_DUE_TYPE_ID${NC}"
echo ""

# Step 4: Prepare test data
CURRENT_DATE=$(date +"%Y-%m-%d")
DUE_DATA="{
  \"dueTypeId\": \"$TEST_DUE_TYPE_ID\",
  \"amount\": 5000,
  \"dueDate\": \"$CURRENT_DATE\",
  \"description\": \"Test from fix verification script\",
  \"title\": \"Due Assignment Fix Test\",
  \"isRecurring\": false
}"

# Step 5: First assignment attempt
echo -e "${YELLOW}First assignment attempt...${NC}"
FIRST_RESPONSE=$(curl -s -X POST $BACKEND_URL/dues/assign/$TEST_PHARMACY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DUE_DATA")

# Check if first assignment was successful
if [[ $FIRST_RESPONSE == *"success\":true"* ]]; then
  echo -e "${GREEN}First assignment successful${NC}"
  DUE_ID=$(echo $FIRST_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
  echo "Due ID: $DUE_ID"
else
  echo -e "${RED}First assignment failed${NC}"
  echo "Response: ${FIRST_RESPONSE:0:200}..."
  exit 1
fi

echo ""

# Step 6: Second assignment attempt (would have failed before the fix)
echo -e "${YELLOW}Second assignment attempt (same pharmacy, same due type, same year)...${NC}"
echo -e "${YELLOW}This would have caused an E11000 duplicate key error before the fix.${NC}"
SECOND_RESPONSE=$(curl -s -X POST $BACKEND_URL/dues/assign/$TEST_PHARMACY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DUE_DATA")

# Check if second assignment was successful
if [[ $SECOND_RESPONSE == *"success\":true"* ]]; then
  echo -e "${GREEN}Second assignment successful - the fix is working!${NC}"
  echo "The second attempt updated the existing due instead of creating a duplicate."
  
  # Check if we got the same due ID back
  SECOND_DUE_ID=$(echo $SECOND_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
  
  if [ "$DUE_ID" == "$SECOND_DUE_ID" ]; then
    echo -e "${GREEN}Verified: Both operations returned the same due ID.${NC}"
    echo "Due ID: $SECOND_DUE_ID"
  else
    echo -e "${YELLOW}Warning: Different due IDs returned.${NC}"
    echo "First Due ID: $DUE_ID"
    echo "Second Due ID: $SECOND_DUE_ID"
  fi
else
  if [[ $SECOND_RESPONSE == *"E11000"* ]]; then
    echo -e "${RED}Second assignment failed with duplicate key error.${NC}"
    echo -e "${RED}The fix does not appear to be working.${NC}"
  else
    echo -e "${RED}Second assignment failed for another reason.${NC}"
  fi
  echo "Response: ${SECOND_RESPONSE:0:200}..."
  exit 1
fi

echo ""
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Test completed successfully!${NC}"
echo -e "${GREEN}The due assignment fix is working correctly.${NC}"
echo -e "${GREEN}===============================================${NC}"
