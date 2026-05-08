# SPA Admin Portal API Payload Fix

Fixed the Vercel `FUNCTION_PAYLOAD_TOO_LARGE` / `Request Entity Too Large` error on Staff Profile update.

## What changed

- Staff photos are now compressed in the browser before saving.
- Oversized old base64 images are removed before API requests.
- Backend refuses to return/store huge `imagePreview` strings.
- My Profile now uses the same API helper instead of hardcoded `localhost` fetch calls.
- Frontend `vercel.json` includes `/api/*` proxy rewrite to the backend URL.

## Required Vercel environment variables

Frontend project:

```env
VITE_API_URL=https://smart-project-allocator-system.vercel.app
```

Backend project:

```env
FRONTEND_URL=https://smart-project-allocator-system-d2j.vercel.app
MONGO_URI=mongodb+srv://spa_admin:YOUR_PASSWORD@cluster0.swvlcma.mongodb.net/spa_admin_db?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB_NAME=spa_admin_db
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@spa.com
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
SECRET_KEY=spa_secret_key_2026
JWT_SECRET_KEY=spa_jwt_secret_key_2026
DEBUG=False
```

After upload, redeploy backend first, then frontend.
