import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
    get_jwt,
)
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from database import init_db, get_db, get_next_id, get_connection_status

from routes.employee_routes import employee_bp
from routes.project_routes import project_bp
from routes.allocation_routes import allocation_bp
from routes.certification_routes import cert_bp
from routes.staffid_routes import staffid_bp
from routes.notification_routes import notification_bp

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False


SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular",
    "Node.js", "Express", "Django", "Flask", "FastAPI", "SQL",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Docker",
    "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Jenkins",
    "CI/CD", "Git", "Linux", "REST API", "GraphQL", "Agile",
    "Scrum", "Figma", "Java", "C++", "Go", "Rust",
    "Machine Learning", "TensorFlow", "PyTorch", "Pandas",
    "Scikit-learn", "Numpy", "HTML5", "CSS3", "Tailwind",
    "Bootstrap", "Spring Boot", "Cybersecurity", "DevOps",
    "Data Science", "AI", "ML", "NLP", "LLM", "OpenAI",
    "Kafka", "RabbitMQ", "Elasticsearch",
]


def _is_admin_role(role: str | None) -> bool:
    normalized = (role or "").strip().lower()
    return normalized in {
        "admin",
        "administrator",
        "superadmin",
        "super_admin",
    }


def _public_api_path(path: str) -> bool:
    public_paths = {
        "/",
        "/api",
        "/api/",
        "/api/health",
        "/api/auth/login",
        "/favicon.ico",
        "/favicon.png",
    }

    return path in public_paths or path.startswith("/static/")


def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return False

    origin = origin.rstrip("/")

    allowed_exact = {
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:4173",
    }

    frontend_url = os.environ.get("FRONTEND_URL", "").strip().rstrip("/")
    if frontend_url:
        allowed_exact.add(frontend_url)

    frontend_urls = os.environ.get("FRONTEND_URLS", "").strip()
    if frontend_urls:
        for url in frontend_urls.split(","):
            url = url.strip().rstrip("/")
            if url:
                allowed_exact.add(url)

    if origin in allowed_exact:
        return True

    # Allow all Vercel preview/production frontend domains
    if re.match(r"^https://[a-zA-Z0-9-]+\.vercel\.app$", origin):
        return True

    return False


def ensure_default_admin() -> None:
    db = get_db()

    username = (Config.ADMIN_USERNAME or "admin").strip().lower()
    email = (Config.ADMIN_EMAIL or "admin@spa.com").strip().lower()
    password = (Config.ADMIN_PASSWORD or "").strip()
    name = (Config.ADMIN_NAME or "SPA Main Admin").strip()

    if not password or len(password) < 6:
        print("[ADMIN] ADMIN_PASSWORD missing or too short. Default admin not created.")
        return

    existing = db.users.find_one({
        "$or": [
            {"email": email},
            {"username": username},
        ]
    })

    admin_data = {
        "name": name,
        "username": username,
        "email": email,
        "passwordHash": generate_password_hash(password),
        "role": "admin",
        "dept": "Management",
        "isActive": True,
    }

    if existing:
        db.users.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": existing.get("name") or name,
                    "username": username,
                    "email": email,
                    "passwordHash": generate_password_hash(password),
                    "role": "admin",
                    "dept": existing.get("dept") or "Management",
                    "isActive": True,
                }
            },
        )

        print(f"[ADMIN] Existing admin password reset and verified: {email} / username: {username}")
        return

    new_id = get_next_id("users")
    admin_data["id"] = new_id

    db.users.insert_one(admin_data)
    print(f"[ADMIN] Default admin created: {email} / username: {username}")


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["DEBUG"] = Config.DEBUG
    app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024

    CORS(
        app,
        resources={
            r"/*": {
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Content-Type", "Authorization"],
            }
        },
        supports_credentials=False,
    )

    JWTManager(app)

    @app.after_request
    def add_cors_headers(response):
        origin = request.headers.get("Origin", "")

        if _is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"

        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Max-Age"] = "86400"

        return response

    @app.before_request
    def handle_options_and_protect_api():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"}), 200

        if not request.path.startswith("/api/"):
            return None

        if _public_api_path(request.path):
            return None

        try:
            verify_jwt_in_request()
            claims = get_jwt() or {}

            if not _is_admin_role(claims.get("role")):
                return jsonify({"message": "Access denied. Admin only."}), 403

        except Exception as exc:
            return jsonify({
                "message": "Login session expired or token missing. Please login again.",
                "error": str(exc),
            }), 401

        return None

    @app.route("/", methods=["GET"])
    def root():
        status = get_connection_status()

        return jsonify({
            "status": "success",
            "service": "SPA Admin Portal Backend",
            "message": "Backend is running successfully on Vercel",
            "backendUrl": "https://smart-project-allocator-system.vercel.app",
            "health": "/api/health",
            "login": "/api/auth/login",
            "databaseConnected": bool(status.get("connected")),
            "database": status.get("database"),
        }), 200

    @app.route("/api", methods=["GET"])
    @app.route("/api/", methods=["GET"])
    def api_root():
        return jsonify({
            "status": "success",
            "service": "SPA Admin Portal API",
            "message": "API is running",
            "routes": {
                "health": "/api/health",
                "login": "/api/auth/login",
                "employees": "/api/employees",
                "projects": "/api/projects",
                "allocation": "/api/allocation/run",
                "certifications": "/api/certifications",
                "staffId": "/api/staff-id",
            },
        }), 200

    @app.route("/favicon.ico", methods=["GET"])
    @app.route("/favicon.png", methods=["GET"])
    def favicon():
        return "", 204

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "status": "error",
            "message": "API route not found",
            "path": request.path,
            "availableRoutes": [
                "/",
                "/api",
                "/api/health",
                "/api/auth/login",
                "/api/auth/me",
                "/api/employees",
                "/api/projects",
                "/api/allocation/run",
                "/api/certifications",
                "/api/staff-id",
            ],
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "status": "error",
            "message": "Internal server error. Check Vercel function logs.",
            "path": request.path,
        }), 500

    with app.app_context():
        try:
            init_db()
            ensure_default_admin()
        except Exception as exc:
            app.config["DB_INIT_ERROR"] = str(exc)
            print(f"[DB] Initialisation skipped: {exc}")

    @app.route("/api/auth/login", methods=["POST", "OPTIONS"])
    def login():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"}), 200

        data = request.get_json(silent=True) or {}

        identifier = (
            data.get("username") or
            data.get("email") or
            ""
        ).strip().lower()

        password = (data.get("password") or "").strip()

        if not identifier or not password:
            return jsonify({
                "message": "Admin username/email and password are required"
            }), 400

        try:
            db = get_db()
            user = db.users.find_one({
                "$or": [
                    {"email": identifier},
                    {"username": identifier},
                ]
            })

            if not user or not check_password_hash(user.get("passwordHash", ""), password):
                return jsonify({
                    "message": "Invalid admin username/email or password"
                }), 401

            if not user.get("isActive", True):
                return jsonify({
                    "message": "Admin account is disabled"
                }), 403

            if not _is_admin_role(user.get("role")):
                return jsonify({
                    "message": "Access denied. Admin only."
                }), 403

            identity = str(user.get("email") or identifier)

            token = create_access_token(
                identity=identity,
                additional_claims={
                    "role": "admin",
                    "username": user.get("username", "admin"),
                    "userId": user.get("id", 0),
                },
            )

            return jsonify({
                "success": True,
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user.get("id", 0),
                    "name": user.get("name", "SPA Main Admin"),
                    "username": user.get("username", "admin"),
                    "email": user.get("email", identity),
                    "role": "admin",
                    "dept": user.get("dept", "Management"),
                },
            }), 200

        except Exception as exc:
            return jsonify({
                "message": "Login failed. Backend database connection error.",
                "error": str(exc),
            }), 500

    @app.route("/api/auth/register", methods=["POST", "OPTIONS"])
    def register_disabled():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"}), 200

        return jsonify({
            "message": "Admin account creation is disabled. Use ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD environment variables."
        }), 403

    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def me():
        email = get_jwt_identity()
        db = get_db()

        user = db.users.find_one(
            {"email": email},
            {"_id": 0, "passwordHash": 0}
        )

        if not user or not _is_admin_role(user.get("role")):
            return jsonify({"message": "Access denied. Admin only."}), 403

        user["role"] = "admin"
        return jsonify(user), 200

    @app.route("/api/auth/profile", methods=["PUT"])
    @jwt_required()
    def update_profile():
        email = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        db = get_db()

        allowed = [
            "name",
            "dept",
            "mobile",
            "dob",
            "doj",
            "address",
            "bio",
        ]

        update_fields = {
            key: data[key]
            for key in allowed
            if key in data
        }

        if not update_fields:
            return jsonify({"message": "No valid fields to update"}), 400

        db.users.update_one(
            {"email": email},
            {"$set": update_fields},
            upsert=False,
        )

        user = db.users.find_one(
            {"email": email},
            {"_id": 0, "passwordHash": 0}
        )

        if not user:
            return jsonify({"message": "Admin user not found"}), 404

        user["role"] = "admin"
        return jsonify(user), 200

    @app.route("/api/auth/change-password", methods=["POST"])
    @jwt_required()
    def change_password():
        email = get_jwt_identity()
        data = request.get_json(silent=True) or {}

        current_pw = data.get("currentPassword", "")
        new_pw = data.get("newPassword", "")

        if not current_pw or not new_pw:
            return jsonify({
                "message": "currentPassword and newPassword are required"
            }), 400

        if len(new_pw) < 6:
            return jsonify({
                "message": "New password must be at least 6 characters"
            }), 400

        db = get_db()
        user = db.users.find_one({"email": email})

        if not user or not _is_admin_role(user.get("role")):
            return jsonify({"message": "Access denied. Admin only."}), 403

        if not check_password_hash(user.get("passwordHash", ""), current_pw):
            return jsonify({"message": "Current password is incorrect"}), 401

        db.users.update_one(
            {"email": email},
            {"$set": {"passwordHash": generate_password_hash(new_pw)}}
        )

        return jsonify({
            "success": True,
            "message": "Password updated successfully"
        }), 200

    @app.route("/api/pdf/analyze", methods=["POST", "OPTIONS"])
    def analyze_pdf():
        if request.method == "OPTIONS":
            return jsonify({"status": "ok"}), 200

        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        uploaded_file = request.files["file"]
        extracted_text = ""

        try:
            if PDF_AVAILABLE and uploaded_file.filename.lower().endswith(".pdf"):
                import io

                reader = PyPDF2.PdfReader(io.BytesIO(uploaded_file.read()))

                for page in reader.pages:
                    extracted_text += (page.extract_text() or "") + "\n"
            else:
                raw = uploaded_file.read()
                extracted_text = raw.decode("utf-8", errors="ignore")

        except Exception as exc:
            extracted_text = f"[Extraction error: {exc}]"

        skills_found = [
            skill
            for skill in SKILL_KEYWORDS
            if skill.lower() in extracted_text.lower()
        ]

        return jsonify({
            "success": True,
            "text": extracted_text[:4000],
            "wordCount": len(extracted_text.split()),
            "skills": skills_found,
            "pdfAvailable": PDF_AVAILABLE,
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health():
        status = get_connection_status()

        if not status.get("connected"):
            return jsonify({
                "status": "error",
                "service": "SPA Admin Portal",
                "database": "MongoDB Atlas",
                "connected": False,
                "setupRequired": True,
                "message": status.get("message"),
                "dbInitError": app.config.get("DB_INIT_ERROR"),
                "backendUrl": "https://smart-project-allocator-system.vercel.app",
                "login": "/api/auth/login",
                "fix": [
                    "Add MONGO_URI in Vercel Backend Environment Variables",
                    "Add MONGO_DB_NAME=spa_admin_db",
                    "Add ADMIN_USERNAME=admin",
                    "Add ADMIN_EMAIL=admin@spa.com",
                    "Add ADMIN_PASSWORD with minimum 6 characters",
                    "MongoDB Atlas > Network Access > Add 0.0.0.0/0",
                    "Redeploy backend after saving environment variables",
                ],
                "pdfAvailable": PDF_AVAILABLE,
            }), 500

        try:
            db = get_db()
            employee_count = db.employees.count_documents({})

            return jsonify({
                "status": "ok",
                "service": "SPA Admin Portal",
                "database": "MongoDB Atlas",
                "connected": True,
                "databaseName": status.get("database"),
                "employees": employee_count,
                "backendUrl": "https://smart-project-allocator-system.vercel.app",
                "login": "/api/auth/login",
                "pdfAvailable": PDF_AVAILABLE,
            }), 200

        except Exception as exc:
            return jsonify({
                "status": "error",
                "message": str(exc),
            }), 500

    app.register_blueprint(employee_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(allocation_bp)
    app.register_blueprint(cert_bp)
    app.register_blueprint(staffid_bp)
    app.register_blueprint(notification_bp)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"\n🚀 SPA Admin Portal API running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)