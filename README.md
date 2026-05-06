# SPA Admin Portal — Fixed

## What's Fixed in This Version

### Project AI Allocation — PDF Auto-Send (Fully Fixed)
When you click **"Save Project & Send PDF to Team"** after AI allocation:

1. **Project is saved** to MongoDB with full team data (head + team array preserved as objects)
2. **PDF report is auto-generated** containing:
   - Project name, description, dates, risk level
   - Required skills (tech stack)
   - AI allocation summary
   - Project Lead with match score
   - All team members with roles and scores
   - Milestones and initial tasks
3. **In-app notifications** are saved to DB for every allocated member (Project Head + all Team Members)
4. **Email with PDF attachment** is sent to each member's email address (requires SMTP config in .env)

### Project Data Storage (Fixed)
- `head` field now stored as `{name, role, color}` object — Employee Portal can correctly identify Project Lead
- `team` field now stored as array of `{name, role, color}` objects — Employee Portal correctly identifies Team Members
- `endDate` field preserved alongside `deadline`
- `aiSummary` and `riskLevel` now properly saved

### Projects API (Fixed)
- `GET /api/projects` is now **public** — Employee Portal can fetch projects without needing Admin JWT

## Setup

### Backend (Python/Flask)
```bash
cd backend
pip install -r requirements.txt   # includes reportlab for PDF generation
python app.py
# Runs on http://localhost:5001
```

### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## SMTP Email Configuration (backend/.env)
To enable automatic PDF emails on project allocation, fill in your SMTP details:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here    # For Gmail, use an App Password
SMTP_FROM=SPA Admin <your_email@gmail.com>
```

**Gmail App Password Setup:**
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Create a new App Password for "Mail"
4. Use that 16-character password as SMTP_PASS

> If SMTP is not configured, the system still saves in-app notifications — employees will see the allocation in their Inbox. PDF emails are sent only when SMTP is configured.

## New API Endpoint
`POST /api/allocation/send-project-notifications` (JWT required)

Sends notifications + PDF emails to all allocated team members.
Body:
```json
{
  "projectId": 1,
  "projectName": "My Project",
  "description": "...",
  "skills": ["React", "Python"],
  "aiSummary": "...",
  "riskLevel": "Medium",
  "startDate": "2026-04-08",
  "endDate": "2026-07-08",
  "milestones": [...],
  "tasks": [...],
  "lead": { "id": 1, "name": "...", "role": "...", "matchScore": 92 },
  "teamMembers": [{ "id": 2, "name": "...", "role": "...", "matchScore": 78 }]
}
```
