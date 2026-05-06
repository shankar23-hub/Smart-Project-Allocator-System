# SPA Admin Portal — Vercel Deployment Guide

This project is ready for Vercel deployment as two separate projects:

- `frontend/` → React + Vite frontend
- `backend/` → Flask + MongoDB API backend

## 1. Deploy Backend First

1. Push this full project to GitHub.
2. Open Vercel → Add New → Project.
3. Import your GitHub repository.
4. Set **Root Directory** to:

```txt
backend
```

5. Use these backend settings:

```txt
Framework Preset: Other
Build Command: leave empty
Output Directory: leave empty
Install Command: pip install -r requirements.txt
```

6. Add these Environment Variables in Vercel backend project:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=spa_db
SECRET_KEY=change-this-secret-key
JWT_SECRET_KEY=change-this-jwt-secret-key
DEBUG=false
FRONTEND_URL=https://your-frontend-project.vercel.app
```

7. Deploy backend.
8. Test backend health URL:

```txt
https://your-backend-project.vercel.app/api/health
```

## 2. Deploy Frontend Second

1. Open Vercel → Add New → Project.
2. Import the same GitHub repository.
3. Set **Root Directory** to:

```txt
frontend
```

4. Use these frontend settings:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. Add this Environment Variable in Vercel frontend project:

```env
VITE_API_URL=https://your-backend-project.vercel.app
```

6. Deploy frontend.

## 3. Final Redeploy

After frontend deployment, copy the frontend Vercel URL and update backend environment variable:

```env
FRONTEND_URL=https://your-frontend-project.vercel.app
```

Then redeploy backend once.

## Important Files Added/Updated

- `backend/app.py`
  - Added top-level `app = create_app()` for Vercel serverless deployment.
  - Added `FRONTEND_URL` CORS support.

- `backend/vercel.json`
  - Added Vercel Python routing for Flask.

- `backend/config.py`
  - Added `MONGO_DB_NAME` support.
  - Added local `.env` loading.

- `backend/database.py`
  - Changed MongoDB selection to `client[Config.MONGO_DB_NAME]`, which is safer for Vercel and Atlas.

- `frontend/src/utils/api.js`
  - Keeps `VITE_API_URL` support and removes trailing slash issues.

## Local Run

Backend:

```powershell
cd backend
pip install -r requirements.txt
python app.py
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

