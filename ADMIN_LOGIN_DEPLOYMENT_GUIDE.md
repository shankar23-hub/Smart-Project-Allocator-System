# SPA Admin Portal - Admin Login Fixed Deployment Guide

## Admin Login

Default admin credentials are created automatically from backend environment variables:

- Username: `admin`
- Email: `admin@spa.com`
- Password: `SpaAdmin@2007`

For final deployment, change `ADMIN_PASSWORD` to a stronger password in Vercel.

## What was fixed

1. Removed unsafe demo login fallback.
2. Disabled public account creation for the Admin Portal.
3. Added automatic admin creation from environment variables.
4. Added admin-only JWT claims and backend API protection.
5. Added frontend admin role check.
6. Changed login page to accept Admin username/email + password.
7. Removed unused lucide-react dependency to avoid deployment package errors.

## Backend Vercel Environment Variables

Add these in Backend Project > Settings > Environment Variables:

```env
MONGO_URI=mongodb+srv://spa_admin:SpaAdmin%402007@cluster0.swvlcma.mongodb.net/spa_admin_db?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB_NAME=spa_admin_db
SECRET_KEY=change-this-secret-key
JWT_SECRET_KEY=change-this-jwt-secret-key
DEBUG=false
FRONTEND_URL=https://your-frontend-project.vercel.app
ADMIN_NAME=SPA Main Admin
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@spa.com
ADMIN_PASSWORD=SpaAdmin@2007
```

Important: if your MongoDB password has `@`, use `%40` in the URL.

## Frontend Vercel Environment Variables

Add this in Frontend Project > Settings > Environment Variables:

```env
VITE_API_URL=https://your-backend-project.vercel.app
```

## Frontend Deploy Settings

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

## Backend Deploy Settings

- Root Directory: `backend`
- Framework: Other
- Build Command: leave empty
- Output Directory: leave empty

## MongoDB Atlas Required Settings

1. Database Access: create user `spa_admin` with your password.
2. Network Access: add `0.0.0.0/0` for Vercel deployment.
3. Use the encoded password in `MONGO_URI`.

## Local Run

Backend:

```bash
cd backend
copy .env.example .env
pip install -r requirements.txt
python app.py
```

Frontend:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```
