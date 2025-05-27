#!/bin/bash

# Check if the backend server is running
echo "Checking if the backend server is running..."

if curl -s http://localhost:5000/api/health-check > /dev/null; then
  echo "✅ Backend server is running at http://localhost:5000/api"
else
  echo "❌ Backend server is not responding at http://localhost:5000/api"
  echo "Make sure the backend server is running with:"
  echo "  cd backend && npm start"
fi

# Check if the frontend Vite server is running
echo ""
echo "Checking if the frontend Vite server is running..."

if curl -s http://localhost:5173 > /dev/null; then
  echo "✅ Frontend server is running at http://localhost:5173"
  echo "🔍 Testing API proxy configuration..."
  
  if curl -s http://localhost:5173/api/health-check > /dev/null; then
    echo "✅ Vite proxy to backend API is working"
    echo "✅ Test API connection at: http://localhost:5173/test-api"
  else
    echo "❌ Vite proxy to backend API is not working"
    echo "Check the proxy configuration in vite.config.ts"
  fi
else
  echo "❌ Frontend server is not running at http://localhost:5173"
  echo "Make sure the frontend server is running with:"
  echo "  cd frontend && npm run dev"
fi

echo ""
echo "📋 Summary of environment:"
echo "- Backend API URL: http://localhost:5000/api"
echo "- Frontend URL: http://localhost:5173"
echo "- API Test Page: http://localhost:5173/test-api"
echo ""
echo "For more detailed API testing, visit the test page at: http://localhost:5173/test-api"
