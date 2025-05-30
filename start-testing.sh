#!/bin/bash

echo "🚀 Starting Document Management System Testing"
echo "=============================================="
echo ""

# Check current directory
echo "📁 Current directory: $(pwd)"
echo ""

# Check if backend directory exists
if [ -d "backend" ]; then
    echo "✅ Backend directory found"
else
    echo "❌ Backend directory not found"
    exit 1
fi

# Check if frontend directory exists
if [ -d "frontend" ]; then
    echo "✅ Frontend directory found"
else
    echo "❌ Frontend directory not found"
    exit 1
fi

echo ""
echo "🔧 Starting backend server..."
cd backend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Backend dependencies are installed"
else
    echo "❌ Backend dependencies not found. Installing..."
    npm install
fi

# Start backend in background
echo "🚀 Starting backend server on port 5000..."
nohup npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "⚠️  Backend might not be fully ready. Checking logs..."
    tail -20 ../backend.log
fi

cd ..

echo ""
echo "🔧 Starting frontend server..."
cd frontend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Frontend dependencies are installed"
else
    echo "❌ Frontend dependencies not found. Installing..."
    npm install
fi

# Start frontend in background
echo "🚀 Starting frontend server on port 3000..."
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

echo ""
echo "✅ SERVERS STARTED:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📋 TESTING CHECKLIST:"
echo "   □ Backend logs: tail -f backend.log"
echo "   □ Frontend logs: tail -f frontend.log"
echo "   □ Open browser to http://localhost:3000"
echo "   □ Login as admin user"
echo "   □ Test document upload functionality"
echo "   □ Test document download functionality"
echo "   □ Test document deletion"
echo "   □ Test member access to documents"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or"
echo "   pkill -f 'npm run dev'"
echo ""
echo "📊 Real-time monitoring:"
echo "   watch 'ps aux | grep -E \"(node|npm)\"'"
