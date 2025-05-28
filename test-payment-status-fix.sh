#!/bin/bash
# Script to test the payment status fix

echo "==== Testing Payment Status Fix ===="

# Check if backend is running
echo "Checking if backend server is running..."
if ! nc -z localhost 5000; then
  echo "❌ Backend server is NOT running on port 5000"
  echo "Please start the backend server with: cd backend && npm run dev"
  exit 1
fi

# Request JWT token
echo -e "\nPlease provide admin credentials to run the test:"
read -p "Email: " EMAIL
read -s -p "Password: " PASSWORD
echo

# Login to get token
echo -e "\nLogging in to get JWT token..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Unable to get token."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Successfully logged in and obtained token"

# Run the fix payment status endpoint
echo -e "\nRunning the fix payment status endpoint..."
FIX_RESPONSE=$(curl -s -X POST http://localhost:5000/api/dues/fix-payment-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Fix payment status response:"
echo $FIX_RESPONSE | python3 -m json.tool

echo -e "\n==== Test Complete ===="
echo "If you see a success message with the number of dues that were fixed, the fix was successful."
echo "You can now try downloading certificates for dues that have been paid."
