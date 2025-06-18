# Complete MERN Stack Deployment to Render - Step by Step Guide

## Phase 1: Backend Configuration

### Step 1: Set up TypeScript Configuration
1. Navigate to your backend folder: `cd backend`
2. Check if `tsconfig.json` exists
3. If not, create it by running: `npx tsc --init`
4. Open `tsconfig.json` and add/modify the compiler options:
   ```json
   {
     "compilerOptions": {
       "outDir": "./dist"
     }
   }
   ```

### Step 2: Add Build Scripts to Backend
1. Open `package.json` in the backend folder
2. Add these two scripts to the scripts section:
   ```json
   {
     "scripts": {
       "build": "npm install && npx tsc",
       "start": "node dist/index.js"
     }
   }
   ```

### Step 3: Test Backend Build
1. In terminal, ensure you're in backend folder: `cd backend`
2. Run the build command: `npm run build`
3. Check that a `dist` folder is created with JavaScript files
4. Test the start command: `npm start`
5. Verify server runs on localhost:7000

## Phase 2: Frontend Configuration

### Step 4: Verify Frontend Build Script
1. Navigate to frontend folder: `cd frontend`
2. Open `package.json` and confirm the build script exists:
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```

### Step 5: Test Frontend Build
1. In terminal, ensure you're in frontend folder: `cd frontend`
2. Run: `npm run build`
3. Verify a `dist` folder is created with HTML, CSS, and JavaScript files

## Phase 3: Bundle Frontend with Backend

### Step 6: Configure Backend to Serve Frontend
1. Open `backend/src/index.ts`
2. Add this import at the top:
   ```typescript
   import path from "path";
   ```
3. After your API endpoints, add this middleware:
   ```typescript
   app.use(express.static(path.join(__dirname, "../../frontend/dist")));
   ```

### Step 7: Update API Client Configuration
1. Open your `api-client.ts` file in the frontend
2. Modify the API base URL configuration to handle production:
   ```typescript
   const API_BASE_URL = process.env.VITE_API_BASE_URL || "";
   ```

### Step 8: Test Full Build Locally
1. Navigate to project root: `cd ..` (to booking-app level)
2. Build frontend first: `cd frontend && npm run build`
3. Build backend: `cd ../backend && npm run build`
4. Start the server: `npm start`
5. Test at localhost:7000 - you should see your frontend served from backend
6. Test login/logout functionality to ensure everything works

## Phase 4: GitHub Repository Setup

### Step 9: Initialize Git Repository
1. Ensure you're at project root level (booking-app)
2. Initialize git: `git init`

### Step 10: Create .gitignore File
1. Create `.gitignore` file at project root
2. Add these entries:
   ```
   node_modules
   .env
   .env.e2e
   .vscode
   dist
   ```

### Step 11: Commit and Push to GitHub
1. Check status: `git status`
2. Add all files: `git add .`
3. Commit: `git commit -m "added auth and auth tests and initial layout"`
4. Rename branch: `git branch -M main`
5. Go to GitHub.com and create a new repository named `mern-booking-app`
6. Copy the remote origin command from GitHub and run it:
   ```bash
   git remote add origin https://github.com/yourusername/mern-booking-app.git
   ```
7. Push code: `git push -u origin main`

## Phase 5: Database Configuration

### Step 12: Configure MongoDB Atlas for Render
1. Go to MongoDB Atlas (mongodb.com)
2. Navigate to your project → Network Access
3. Add these IP addresses for Render servers:
   - Click "ADD IP ADDRESS"
   - Add each of these IPs (get the exact IPs from Render documentation)
   - Also ensure your own IP is whitelisted

## Phase 6: Render Deployment

### Step 13: Create Render Account and Web Service
1. Go to render.com and sign up/sign in
2. Click "New" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub repository (mern-booking-app)

### Step 14: Configure Build Settings
1. **Name**: `mern-booking-app`
2. **Region**: Select closest to your location
3. **Build Command**:
   ```bash
   cd frontend && npm install && npm run build && cd ../backend && npm run build
   ```
4. **Start Command**:
   ```bash
   cd backend && npm start
   ```

### Step 15: Add Environment Variables
1. Scroll to "Advanced" section
2. Add these environment variables:
   - **Key**: `MONGODB_CONNECTION_STRING`
     **Value**: Your MongoDB connection string from .env file
   - **Key**: `JWT_SECRET_KEY`
     **Value**: Your JWT secret from .env file
   - **Key**: `NODE_VERSION`
     **Value**: `20.10.0` (or your Node version)

### Step 16: Deploy
1. Click "Create Web Service"
2. Monitor the build process in the console
3. Wait for status to change to "Live"
4. Click the provided URL to access your deployed application

## Phase 7: Testing Deployment

### Step 17: Verify Deployment
1. Open the Render-provided URL
2. Test the following functionality:
   - Homepage loads correctly
   - Sign in with existing credentials
   - Verify navigation links appear after login
   - Test sign out functionality
   - Ensure all features work as expected

## Troubleshooting Tips

- If build fails, check the console logs in Render dashboard
- Ensure all environment variable names match exactly with your code
- Verify MongoDB Atlas IP whitelist includes Render IPs
- Check that all npm dependencies are listed in package.json files
- Ensure TypeScript builds without errors locally before deploying

## Future Updates

After initial deployment, any time you push changes to your GitHub repository's main branch, Render will automatically:
1. Pull the latest code
2. Run the build process
3. Deploy the updated application

This completes your MERN stack deployment to Render!