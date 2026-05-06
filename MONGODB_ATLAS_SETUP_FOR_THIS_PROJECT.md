# MongoDB Atlas Setup for This SPA Admin Portal

## 1. Add IP Address Access

Open MongoDB Atlas:

`Security > Network Access > IP Access List > Add IP Address`

For local VS Code testing, click:

`Add Current IP Address`

For Vercel backend deployment, add:

`0.0.0.0/0`

Then click **Confirm**.

## 2. Create Database User

Open:

`Security > Database Access > Add New Database User`

Use **Password** authentication.

Example:

- Username: `spa_admin_user`
- Password: use a strong password without `< >` symbols
- Role: `Read and write to any database`

## 3. Copy Connection String

Open:

`Database > Cluster > Connect > Drivers`

Copy the MongoDB URI and paste it in:

`backend/.env`

Correct format:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/spa_admin?retryWrites=true&w=majority&appName=SPA-ADMIN
MONGO_DB_NAME=spa_admin
```

Important: Replace `USERNAME`, `PASSWORD`, and `CLUSTER`.

## 4. Run Backend

```powershell
cd backend
pip install -r requirements.txt
python app.py
```

Open:

`http://localhost:5001/api/health`

Success output includes:

```json
{
  "status": "ok",
  "connected": true,
  "database": "MongoDB Atlas"
}
```

## 5. Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:

`http://localhost:5173`

## Common Fixes

### Error: MONGO_URI still contains placeholder

Open `backend/.env` and replace `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_CLUSTER`.

### Error: Could not connect to any servers

Fix Atlas Network Access:

- Local: Add Current IP Address
- Vercel: Add `0.0.0.0/0`

### Error: Authentication failed

Fix Atlas Database Access username/password and update `backend/.env`.
