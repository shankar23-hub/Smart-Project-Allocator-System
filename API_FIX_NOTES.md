# SPA Admin Portal API Fix Notes

Fixed API connection issue shown in browser alert:

`Failed to fetch backend API. Check backend URL, Vercel deployment, and CORS. API URL: https://smart-project-allocator-system.vercel.app`

## Main Fixes Added

1. `frontend/src/utils/api.js`
   - Uses correct backend URL: `https://smart-project-allocator-system.vercel.app`
   - Uses correct login route: `/api/auth/login`
   - Adds direct backend request first
   - Adds Vercel same-origin proxy fallback for `/api/*`
   - Handles JSON, FormData uploads, JWT token, 401 logout, and better error messages

2. `frontend/vercel.json`
   - Adds proxy rewrite:
     `/api/* -> https://smart-project-allocator-system.vercel.app/api/*`
   - Keeps React SPA fallback to `/index.html`

3. `frontend/src/pages/MyProfile.jsx`
   - Removed hardcoded `http://localhost:5000`
   - Uses shared `authAPI` from `utils/api.js`

4. `frontend/src/pages/ProjectAIAllocation.jsx`
   - Removed direct manual `fetch`
   - Uses `allocationAPI.sendProjectNotifications()`

5. Backend is already Vercel-ready with:
   - `app = create_app()` serverless entry point
   - `/`, `/api`, `/api/health`, `/api/auth/login`
   - CORS and OPTIONS handling

## Required Vercel Environment Variables

### Frontend Vercel Project

```env
VITE_API_URL=https://smart-project-allocator-system.vercel.app
```

### Backend Vercel Project

```env
FRONTEND_URL=https://smart-project-allocator-system-dj2j.vercel.app
FRONTEND_URLS=https://smart-project-allocator-system-dj2j.vercel.app,https://smart-project-allocator-system-d2j.vercel.app
MONGO_URI=mongodb+srv://spa_admin:YOUR_PASSWORD@cluster0.swvlcma.mongodb.net/spa_admin_db?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB_NAME=spa_admin_db
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@spa.com
ADMIN_PASSWORD=SpaAdmin@2007
SECRET_KEY=change-this-secret-key
JWT_SECRET_KEY=change-this-jwt-secret-key
DEBUG=false
```

## Deploy Order

1. Deploy backend first.
2. Open `https://smart-project-allocator-system.vercel.app/` and check JSON response.
3. Open `https://smart-project-allocator-system.vercel.app/api/health`.
4. Deploy frontend.
5. Login, then add staff.

## Important

If frontend still shows the old alert, clear browser cache or redeploy frontend after adding `VITE_API_URL`.
