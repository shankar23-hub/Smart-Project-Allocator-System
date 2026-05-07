import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash

from config   import Config
from database import init_db, get_db, get_next_id, get_connection_status
from routes.employee_routes      import employee_bp
from routes.project_routes       import project_bp
from routes.allocation_routes    import allocation_bp
from routes.certification_routes import cert_bp
from routes.staffid_routes       import staffid_bp
from routes.notification_routes  import notification_bp

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

SKILL_KEYWORDS = [
    "Python","JavaScript","TypeScript","React","Vue","Angular","Node.js","Express",
    "Django","Flask","FastAPI","SQL","PostgreSQL","MySQL","MongoDB","Redis","SQLite",
    "Docker","Kubernetes","AWS","Azure","GCP","Terraform","Jenkins","CI/CD","Git",
    "Linux","REST API","GraphQL","Agile","Scrum","Figma","Java","C++","Go","Rust",
    "Machine Learning","TensorFlow","PyTorch","Pandas","Scikit-learn","Numpy",
    "HTML5","CSS3","Tailwind","Bootstrap","Spring Boot","Cybersecurity","DevOps",
    "Data Science","AI","ML","NLP","LLM","OpenAI","Kafka","RabbitMQ","Elasticsearch",
]


def _is_admin_role(role: str | None) -> bool:
    normalized = (role or "").strip().lower()
    return normalized in {"admin", "administrator", "superadmin", "super_admin"}


def _public_api_path(path: str) -> bool:
    return path in {"/", "/api/health", "/api/auth/login", "/favicon.ico", "/favicon.png"} or path.startswith("/static/")


def ensure_default_admin() -> None:
    db = get_db()
    username = (Config.ADMIN_USERNAME or "admin").strip().lower()
    email = (Config.ADMIN_EMAIL or "admin@spa.com").strip().lower()
    password = (Config.ADMIN_PASSWORD or "").strip()
    name = (Config.ADMIN_NAME or "SPA Main Admin").strip()
    if not password or len(password) < 6:
        print("[ADMIN] ADMIN_PASSWORD missing/too short. Default admin was not created.")
        return
    existing = db.users.find_one({"$or": [{"email": email}, {"username": username}]})
    if existing:
        # Important fix:
        # If the admin already exists, keep the same account but reset its password
        # from ADMIN_PASSWORD. Without this, MongoDB may keep an old passwordHash,
        # and /api/auth/login will always return 401 even when .env is correct.
        db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "name": existing.get("name") or name,
                "username": username,
                "email": email,
                "passwordHash": generate_password_hash(password),
                "role": "admin",
                "dept": existing.get("dept") or "Management",
                "isActive": True,
            }},
        )
        print(f"[ADMIN] Existing admin password reset and verified: {email} / username: {username}")
        return
    new_id = get_next_id("users")
    db.users.insert_one({"id": new_id, "name": name, "username": username, "email": email, "passwordHash": generate_password_hash(password), "role": "admin", "dept": "Management", "isActive": True})
    print(f"[ADMIN] Default admin created: {email} / username: {username}")


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"]         = Config.SECRET_KEY
    app.config["JWT_SECRET_KEY"]     = Config.JWT_SECRET_KEY
    app.config["DEBUG"]              = Config.DEBUG
    app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB

    # CORS setup for local development + deployed Vercel frontend.
    # Add your live frontend URL in Vercel as FRONTEND_URL.
    frontend_url = os.environ.get("FRONTEND_URL", "").strip().rstrip("/")
    cors_origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:4173", "http://127.0.0.1:4173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ]
    if frontend_url:
        cors_origins.append(frontend_url)

    CORS(app, resources={
        r"/api/*": {"origins": cors_origins},
        r"/": {"origins": cors_origins},
        r"/favicon.*": {"origins": "*"},
    }, supports_credentials=True)

    JWTManager(app)

    @app.before_request
    def protect_admin_api():
        if request.method == "OPTIONS":
            return None
        if not request.path.startswith("/api/") or _public_api_path(request.path):
            return None
        verify_jwt_in_request()
        claims = get_jwt() or {}
        if not _is_admin_role(claims.get("role")):
            return jsonify({"message": "Access denied. Admin only."}), 403
        return None

    # ── Vercel Root / Browser Routes ─────────────────────────────────────────
    @app.route("/", methods=["GET"])
    def root():
        status = get_connection_status()
        return jsonify({
            "status": "success",
            "service": "SPA Admin Portal Backend",
            "message": "Backend is running successfully on Vercel",
            "health": "/api/health",
            "databaseConnected": bool(status.get("connected")),
            "database": status.get("database"),
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
            "available": ["/", "/api/health", "/api/auth/login", "/api/employees", "/api/projects"],
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "status": "error",
            "message": "Internal server error. Check Vercel logs for details.",
        }), 500

    # Initialise MongoDB. Do not crash the entire server during first setup;
    # /api/health will show the exact MongoDB error until .env/IP/password is fixed.
    with app.app_context():
        try:
            init_db()
            ensure_default_admin()
        except Exception as exc:
            app.config["DB_INIT_ERROR"] = str(exc)
            print(f"[DB] Initialisation skipped: {exc}")

    # ── Admin Auth: Login ─────────────────────────────────────────────────────
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.get_json(silent=True) or {}
        identifier = (data.get("username") or data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        if not identifier or not password:
            return jsonify({"message": "Admin username/email and password are required"}), 400
        db = get_db()
        user = db.users.find_one({"$or": [{"email": identifier}, {"username": identifier}]})
        if not user or not check_password_hash(user.get("passwordHash", ""), password):
            return jsonify({"message": "Invalid admin username/email or password"}), 401
        if not user.get("isActive", True):
            return jsonify({"message": "Admin account is disabled"}), 403
        if not _is_admin_role(user.get("role")):
            return jsonify({"message": "Access denied. Admin only."}), 403
        identity = str(user.get("email") or identifier)
        token = create_access_token(identity=identity, additional_claims={"role": "admin", "username": user.get("username", "admin"), "userId": user.get("id", 0)})
        return jsonify({"token": token, "user": {"id": user.get("id", 0), "name": user.get("name", "SPA Main Admin"), "username": user.get("username", "admin"), "email": user.get("email", identity), "role": "admin", "dept": user.get("dept", "Management")}}), 200

    @app.route("/api/auth/register", methods=["POST"])
    def register_disabled():
        return jsonify({"message": "Admin account creation is disabled. Use ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD environment variables."}), 403

    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def me():
        email = get_jwt_identity()
        db = get_db()
        user = db.users.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
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
        allowed = ["name", "dept", "mobile", "dob", "doj", "address", "bio"]
        update_fields = {k: data[k] for k in allowed if k in data}
        if not update_fields:
            return jsonify({"message": "No valid fields to update"}), 400
        db.users.update_one({"email": email}, {"$set": update_fields}, upsert=False)
        user = db.users.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
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
            return jsonify({"message": "currentPassword and newPassword are required"}), 400
        if len(new_pw) < 6:
            return jsonify({"message": "New password must be at least 6 characters"}), 400
        db = get_db()
        user = db.users.find_one({"email": email})
        if not user or not _is_admin_role(user.get("role")):
            return jsonify({"message": "Access denied. Admin only."}), 403
        if not check_password_hash(user.get("passwordHash", ""), current_pw):
            return jsonify({"message": "Current password is incorrect"}), 401
        db.users.update_one({"email": email}, {"$set": {"passwordHash": generate_password_hash(new_pw)}})
        return jsonify({"success": True, "message": "Password updated successfully"}), 200

    # ── PDF Analysis ──────────────────────────────────────────────────────────
    @app.route("/api/pdf/analyze", methods=["POST"])
    def analyze_pdf():
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        f = request.files["file"]
        extracted_text = ""
        try:
            if PDF_AVAILABLE and f.filename.lower().endswith(".pdf"):
                import io
                reader = PyPDF2.PdfReader(io.BytesIO(f.read()))
                for page in reader.pages:
                    extracted_text += (page.extract_text() or "") + "\n"
            else:
                raw = f.read()
                extracted_text = raw.decode("utf-8", errors="ignore")
        except Exception as exc:
            extracted_text = f"[Extraction error: {exc}]"
        skills_found = [sk for sk in SKILL_KEYWORDS if sk.lower() in extracted_text.lower()]
        return jsonify({"success": True, "text": extracted_text[:4000],
                        "wordCount": len(extracted_text.split()),
                        "skills": skills_found, "pdfAvailable": PDF_AVAILABLE})

    # ── Health ────────────────────────────────────────────────────────────────
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
                "fix": [
                    "Replace <db_password> in backend/.env with your real Atlas database user password",
                    "Atlas > Network Access > Add Current IP Address",
                    "For Vercel, add 0.0.0.0/0 in Network Access",
                    "Restart backend after saving .env",
                ],
                "pdfAvailable": PDF_AVAILABLE,
            }), 500

        try:
            db = get_db()
            count = db.employees.count_documents({})
            return jsonify({
                "status": "ok",
                "service": "SPA Admin Portal",
                "database": "MongoDB Atlas",
                "connected": True,
                "databaseName": status.get("database"),
                "employees": count,
                "pdfAvailable": PDF_AVAILABLE,
            })
        except Exception as exc:
            return jsonify({"status": "error", "message": str(exc)}), 500

    # ── Blueprints ────────────────────────────────────────────────────────────
    app.register_blueprint(employee_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(allocation_bp)
    app.register_blueprint(cert_bp)
    app.register_blueprint(staffid_bp)
    app.register_blueprint(notification_bp)

    return app


# Vercel/Python serverless entry point must expose a top-level variable named `app`.
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"\n🚀 SPA Admin Portal API running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
