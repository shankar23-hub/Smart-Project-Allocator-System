import os
from dotenv import load_dotenv

# Load backend/.env during local development. In Vercel, set these values in
# Project Settings > Environment Variables and redeploy.
load_dotenv()


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    # Flask/JWT
    SECRET_KEY = os.environ.get("SECRET_KEY", "spa-secret-key-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "spa-jwt-secret-change-me")
    DEBUG = _env_bool("DEBUG", False)

    # MongoDB Atlas
    # Example:
    # mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/spa_admin?retryWrites=true&w=majority&appName=SPA-ADMIN
    MONGO_URI = os.environ.get("MONGO_URI", "").strip()
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "spa_admin_db").strip() or "spa_admin_db"

    # Frontend URL used by CORS
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")

    # Default admin values for first secure setup. Set these in Vercel.
    ADMIN_NAME = os.environ.get("ADMIN_NAME", "SPA Main Admin")
    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@spa.com")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "SpaAdmin@2007")

    # Email settings are optional
    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER", "")
    SMTP_PASS = os.environ.get("SMTP_PASS", "")
    SMTP_FROM = os.environ.get("SMTP_FROM", "SPA Admin")
