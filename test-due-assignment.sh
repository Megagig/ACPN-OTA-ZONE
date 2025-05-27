#!/bin/bash

echo "=== Testing due assignment functionality ==="
echo "Date: $(date)"
echo ""

# First, let's check if we can get the due types
echo "Fetching due types..."
DUE_TYPES=$(curl -s http://localhost:5000/api/due-types)
echo "Response received"

# Print a sample of the response to save space
echo "${DUE_TYPES:0:100}..."
echo ""

# Now let's test assigning a due to a pharmacy
# We'll need to authenticate first to get a token
echo "Authenticating..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}')

echo "Response received"
echo "${TOKEN_RESPONSE:0:100}..."
echo ""

# Extract token from JSON response
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed, cannot proceed with tests"
  exit 1
fi

echo "✅ Authentication successful, token obtained"
echo "Token: ${TOKEN:0:20}..." # Show first 20 chars of token for verification
echo ""

# Now let's get a pharmacy ID
echo "Fetching pharmacies..."
PHARMACIES=$(curl -s http://localhost:5000/api/pharmacies \
  -H "Authorization: Bearer $TOKEN")

echo "Response received"
echo "${PHARMACIES:0:100}..."
echo ""

# Let's get a due type ID
echo "Fetching due types again with authentication..."
DUE_TYPES_AUTH=$(curl -s http://localhost:5000/api/due-types \
  -H "Authorization: Bearer $TOKEN")

echo "Response received"
echo "${DUE_TYPES_AUTH:0:100}..."
echo ""

echo "=== Summary of Test Environment ==="
echo "- Backend URL: http://localhost:5000/api"
echo "- Authentication: ${TOKEN:0:10}..." # First 10 chars of token
echo ""
echo "The script has completed. To continue testing, you should:"
echo "1. Extract a pharmacy ID and due type ID from the responses above"
echo "2. Use these IDs to manually test the due assignment endpoint with:"
echo ""
echo "curl -X POST http://localhost:5000/api/dues/assign/PHARMACY_ID \\"
echo "  -H 'Authorization: Bearer TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"dueTypeId\": \"DUE_TYPE_ID\","
echo "    \"amount\": 5000,"
echo "    \"dueDate\": \"2025-12-31\","
echo "    \"description\": \"Test due assignment\","
echo "    \"title\": \"Test Due\","
echo "    \"isRecurring\": false"
echo "  }'"
echo ""
echo "3. Try assigning the same due type to the same pharmacy again to verify that the E11000 duplicate key error is resolved"
