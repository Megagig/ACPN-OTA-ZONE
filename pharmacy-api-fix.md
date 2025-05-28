# Pharmacy API 500 Error Fix

This guide provides steps to fix the 500 Internal Server Error when accessing the `/api/pharmacies/me` endpoint.

## Problem Description

When a user tries to access the dashboard, the frontend makes a GET request to `/api/pharmacies/me` which returns a 500 Internal Server Error. This happens even when the user is properly authenticated.

Error in console:

```
GET http://localhost:5173/api/pharmacies/me 500 (Internal Server Error)
```

## Root Causes & Solutions

There are several potential causes for this issue:

### 1. Authentication Issues

**Symptoms:**

- JWT token not being correctly validated
- User not being properly attached to the request object

**Solutions:**

- Check that the JWT token is correctly formatted and not expired
- Verify that the auth middleware is correctly setting `req.user`

### 2. Database Connection Issues

**Symptoms:**

- MongoDB connection errors
- Timeouts when querying the database

**Solutions:**

- Verify MongoDB connection string is correct
- Check if MongoDB service is running
- Ensure proper indexes are set on the Pharmacy collection

### 3. Code Errors in Controller

**Symptoms:**

- Unhandled exceptions in the controller function
- Missing error handling for edge cases

**Solution:**

- Replace the existing `getMyPharmacy` function with the enhanced version in `fix-pharmacy-controller.ts`

## Implementation Steps

1. **Run Diagnostic Script**

   ```bash
   ./debug-pharmacy-api.sh
   ```

   This will check if the API is accessible and test authentication.

2. **Update Pharmacy Controller**

   Replace the existing `getMyPharmacy` function in `pharmacy.controller.ts` with the enhanced version:

   ```bash
   # From the project root
   cp backend/src/controllers/fix-pharmacy-controller.ts backend/src/controllers/pharmacy.controller.ts.new
   # Then manually integrate the new getMyPharmacy function into the existing controller
   ```

3. **Restart Backend Server**

   ```bash
   # From the project root
   cd backend
   npm run build
   npm run dev
   ```

4. **Check Authentication**

   Ensure that the user's token is valid and not expired:

   ```bash
   # Frontend code to check token expiration
   const token = localStorage.getItem('token');
   if (token) {
     const payload = JSON.parse(atob(token.split('.')[1]));
     const isExpired = payload.exp < Date.now() / 1000;
     console.log('Token expired:', isExpired);
   }
   ```

5. **Verify Database Connection**

   ```bash
   # Add this to backend/src/config/db.ts
   mongoose.connection.on('connected', () => {
     console.log('MongoDB connected successfully');
   });

   mongoose.connection.on('error', (err) => {
     console.error('MongoDB connection error:', err);
   });
   ```

## Additional Debugging Tips

1. **Enable Verbose Logging**

   The enhanced error middleware and controller functions now include detailed logging.

2. **Check Network Tab**

   In browser dev tools, examine the Network tab to see the exact response from the server.

3. **Verify JWT Token**

   Use a tool like [jwt.io](https://jwt.io) to decode your token and check if it's valid.

4. **Database Integrity**

   Ensure the user ID stored in the token matches a valid user in the database, and that user has an associated pharmacy.

## Contact Support

If you continue to experience issues after implementing these fixes, please contact the development team with:

1. Backend logs showing the detailed error
2. Browser console logs
3. Network request/response details from browser dev tools
