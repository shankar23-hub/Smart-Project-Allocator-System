# SPA Admin Portal - Vercel Zero Error Deployment

## Backend Deployment

Deploy the `backend` folder as a separate Vercel project.

### Backend Vercel Settings

- Framework Preset: Other
- Root Directory: `backend`
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: `pip install -r requirements.txt`

### Backend Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```env
MONGO_URI=mongodb+srv://spa_admin:YOUR_URL_ENCODED_PASSWORD@cluster0.swvlcma.mongodb.net/spa_admin_db?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB_NAME=spa_admin_db
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret-key
DEBUG=false
FRONTEND_URL=https://your-frontend-project.vercel.app
```

If your password contains `@`, write it as `%40`.
Example: `MyPass@123` becomes `MyPass%40123`.

### Backend Test URLs

After deployment, open:

```txt
https://your-backend-project.vercel.app/
https://your-backend-project.vercel.app/api/health
```

Both should return JSON.

## Frontend Deployment

Deploy the `frontend` folder as a separate Vercel project.

### Frontend Vercel Settings

- Framework Preset: Vite
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### Frontend Environment Variable

```env
VITE_API_URL=https://your-backend-project.vercel.app
```

Then redeploy frontend.

## MongoDB Atlas Network Access

MongoDB Atlas > Network Access > Add IP Address:

```txt
0.0.0.0/0
```

This is required because Vercel serverless IPs change.
