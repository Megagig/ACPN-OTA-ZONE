#!/bin/bash
# Script to debug the pharmacy API issue

echo "==== Debugging Pharmacy API Issue ===="

# 1. Check if backend server is running
echo "Checking if backend server is running..."
if nc -z localhost 5000; then
  echo "✅ Backend server is running on port 5000"
else
  echo "❌ Backend server is NOT running on port 5000"
  echo "Please start the backend server with: cd backend && npm run dev"
  exit 1
fi

# 2. Check if we can access the API health check endpoint
echo -e "\nTesting API health check..."
HEALTH_CHECK=$(curl -s http://localhost:5000/api/health-check)
if [[ $HEALTH_CHECK == *"success"* ]]; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed"
  echo "Response: $HEALTH_CHECK"
fi

# 3. Test authentication (requires a valid token)
echo -e "\nTo test authentication, please provide a valid JWT token:"
read -p "Enter JWT token: " TOKEN

if [ -z "$TOKEN" ]; then
  echo "No token provided, skipping authentication tests"
else
  echo -e "\nTesting authentication with token..."
  AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/users/me)
  if [[ $AUTH_RESPONSE == *"success"* ]]; then
    echo "✅ Authentication successful"
    echo "User data: $AUTH_RESPONSE"
    
    # 4. Test pharmacy endpoint
    echo -e "\nTesting pharmacy endpoint with token..."
    PHARMACY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/pharmacies/me)
    echo "Pharmacy endpoint response: $PHARMACY_RESPONSE"
  else
    echo "❌ Authentication failed"
    echo "Response: $AUTH_RESPONSE"
  fi
fi

echo -e "\n==== Debug Complete ===="
echo "If you're still having issues, check the backend logs for more details"
