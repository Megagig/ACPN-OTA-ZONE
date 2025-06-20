# Frontend Deployment Guide for Render

## Fixed TypeScript Build Errors

The following issues have been resolved:

1. **`import.meta.env` TypeScript errors**: Updated `vite-env.d.ts` with proper type definitions
2. **UUID type declarations**: Ensured `@types/uuid` is installed
3. **Environment variable safety**: Added optional chaining and fallbacks
4. **Created utility functions**: Added `src/utils/env.ts` for safer environment variable access

## Environment Variables for Render

Set these environment variables in your Render dashboard:

### Required Variables:
```
VITE_API_URL=https://your-backend-app.onrender.com
VITE_SOCKET_URL=https://your-backend-app.onrender.com
VITE_WS_URL=wss://your-backend-app.onrender.com
VITE_APP_NAME=ACPN OTA Zone
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
VITE_BACKEND_URL=https://your-backend-app.onrender.com
```

**Important**: Do NOT include `/api` in the VITE_API_URL - the frontend code handles the API path internally.

## Build Settings for Render

### Build Command:
```
npm install && npm run build
```

### Start Command:
```
npm run preview
```

### Publish Directory:
```
dist
```

### Node Version:
Set the Node.js version in your package.json:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Build Process

The TypeScript compilation will now succeed because:

1. All environment variables are properly typed
2. UUID types are available
3. Safe fallbacks are provided for missing environment variables
4. The build process includes TypeScript checking (`tsc && vite build`)

## Troubleshooting

If you still encounter build errors:

1. Check that all environment variables are set in Render
2. Ensure your backend URL is correct and accessible
3. Verify that `@types/uuid` is in your dependencies
4. Check the build logs for any missing dependencies

## Files Modified:

- `src/vite-env.d.ts` - Added comprehensive type definitions
- `tsconfig.json` - Explicitly included vite-env.d.ts
- `src/utils/env.ts` - Created safe environment variable utilities
- `src/services/api.ts` - Updated to use safe environment access
- `src/services/socket.service.ts` - Updated to use safe environment access
- `src/utils/apiClient.ts` - Updated to use safe environment access
- `src/pages/dashboard/DonationsManagement.tsx` - Updated to use safe environment access
