"""
certification_routes.py – Certificate upload, approval, rejection, and advanced AI analysis.
Uses pdfplumber (primary) + PyPDF2 (fallback) for robust PDF text extraction.
Advanced NLP-style analysis with regex patterns, metadata extraction, and confidence scoring.
"""
import os, io, re, base64
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, verify_jwt_in_request
from database import get_db, get_next_id

cert_bp = Blueprint("certifications", __name__, url_prefix="/api/certifications")

SKILL_KEYWORDS = [
    "Python","JavaScript","TypeScript","React","Vue","Angular","Node.js","Express",
    "Django","Flask","FastAPI","SQL","PostgreSQL","MySQL","MongoDB","Redis","SQLite",
    "Docker","Kubernetes","AWS","Azure","GCP","Terraform","Jenkins","CI/CD","Git",
    "Linux","REST API","GraphQL","Agile","Scrum","Figma","Java","C++","Go","Rust",
    "Machine Learning","TensorFlow","PyTorch","Pandas","Scikit-learn","Numpy",
    "HTML5","CSS3","Tailwind","Bootstrap","Spring Boot","Cybersecurity","DevOps",
    "Data Science","AI","ML","NLP","LLM","OpenAI","Kafka","RabbitMQ","Elasticsearch",
    "Blockchain","Swift","Kotlin","Flutter","React Native","JIRA","Confluence",
    "PMP","PRINCE2","Six Sigma","ISO","ITIL","Scrum Master","Product Management",
    "Power BI","Tableau","Excel","SAP","Salesforce","ServiceNow",
]

KNOWN_ISSUERS = [
    "coursera","udemy","google","amazon","microsoft","ibm","oracle","cisco",
    "comptia","aws","azure","pmi","isaca","red hat","linux foundation","sans",
    "ec-council","isc2","pearson","certiport","udacity","edx","linkedin learning",
    "simplilearn","great learning","nptel","infosys","tcs","wipro","nasscom",
    "pmbok","axelos","togaf","opengroup","vmware","salesforce","servicenow",
    "adobe","autodesk","netapp","fortinet","palo alto","checkpoint",
]

AUTHORITY_KEYWORDS = [
    "issued by","certificate of","this certifies","is hereby","awarded to",
    "completion","participation","achievement","authorized","official",
    "registry","verification","id:","certificate id","credential id",
    "expiry","valid until","issue date","date of issue","in recognition",
    "has successfully","has completed","certificate number","serial number",
]


def extract_text_advanced(pdf_bytes: bytes) -> tuple[str, dict]:
    """
    Advanced PDF text extraction using pdfplumber (primary) with PyPDF2 fallback.
    Returns (text, metadata_dict).
    """
    text = ""
    metadata = {}

    # Try pdfplumber first (best quality extraction)
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                pages_text.append(page_text)
            text = "\n".join(pages_text)
            # Extract PDF metadata
            if pdf.metadata:
                m = pdf.metadata
                metadata = {
                    "title":    m.get("Title", ""),
                    "author":   m.get("Author", ""),
                    "creator":  m.get("Creator", ""),
                    "producer": m.get("Producer", ""),
                    "subject":  m.get("Subject", ""),
                    "pages":    len(pdf.pages),
                }
        return text, metadata
    except Exception:
        pass

    # Fallback: PyPDF2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        for page in reader.pages:
            pages_text.append(page.extract_text() or "")
        text = "\n".join(pages_text)
        # PyPDF2 metadata
        try:
            info = reader.metadata
            if info:
                metadata = {
                    "title":   info.get("/Title", ""),
                    "author":  info.get("/Author", ""),
                    "creator": info.get("/Creator", ""),
                    "subject": info.get("/Subject", ""),
                    "pages":   len(reader.pages),
                }
        except Exception:
            pass
        return text, metadata
    except Exception as e:
        return f"[PDF extraction error: {e}]", {}


def analyze_certificate_advanced(text: str, filename: str, metadata: dict) -> dict:
    """
    Advanced certificate authenticity analysis using NLP-style regex patterns,
    signal weighting, metadata validation, and confidence scoring.
    """
    text_lower = text.lower()
    positive_signals = []
    negative_signals = []
    warning_signals  = []
    score = 50  # baseline

    # ── 1. Authority markers ──────────────────────────────────────────────────
    found_authority = [kw for kw in AUTHORITY_KEYWORDS if kw in text_lower]
    if len(found_authority) >= 4:
        positive_signals.append(f"Strong official authority markers found ({len(found_authority)} indicators)")
        score += 18
    elif len(found_authority) >= 2:
        positive_signals.append(f"Official authority markers present ({len(found_authority)} indicators)")
        score += 10
    elif len(found_authority) == 1:
        positive_signals.append("At least one authority marker found")
        score += 5
    else:
        negative_signals.append("No official issuing authority markers detected")
        score -= 15

    # ── 2. Known issuer detection ─────────────────────────────────────────────
    found_issuers = [iss for iss in KNOWN_ISSUERS if iss in text_lower]
    # Also check metadata
    meta_text = " ".join(str(v).lower() for v in metadata.values() if v)
    meta_issuers = [iss for iss in KNOWN_ISSUERS if iss in meta_text]
    all_issuers = list(set(found_issuers + meta_issuers))
    if all_issuers:
        positive_signals.append(f"Recognized issuer(s) detected: {', '.join(all_issuers[:3])}")
        score += 15
    else:
        warning_signals.append("No recognized certification issuer found in document")
        score -= 5

    # ── 3. Date patterns ─────────────────────────────────────────────────────
    date_patterns = [
        r'\b\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b',
        r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{4}[/\-]\d{2}[/\-]\d{2}\b',
        r'\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\b',
    ]
    date_matches = [p for p in date_patterns if re.search(p, text_lower)]
    if len(date_matches) >= 2:
        positive_signals.append(f"Multiple date fields present ({len(date_matches)} date patterns matched)")
        score += 12
    elif date_matches:
        positive_signals.append("Issue or expiry date present in document")
        score += 7
    else:
        warning_signals.append("No clear date found — certificate dates are normally required")
        score -= 8

    # ── 4. Certificate / Credential ID ───────────────────────────────────────
    id_patterns = [
        r'cert(?:ificate)?\s*(?:id|#|no|number)[:\s]+[\w\-]{4,}',
        r'credential\s*id[:\s]+[\w\-]{4,}',
        r'verification\s*(?:code|id|link)[:\s]+[\w\-]{4,}',
        r'serial\s*(?:no|number)[:\s]+[\w\-]{4,}',
        r'\b[A-Z]{2,6}[-/]\d{4,}\b',  # e.g. AWS-12345, CERT/2024001
    ]
    id_found = [p for p in id_patterns if re.search(p, text_lower)]
    if id_found:
        positive_signals.append(f"Certificate/Credential ID detected ({len(id_found)} ID pattern(s) matched)")
        score += 14
    else:
        warning_signals.append("No certificate ID or verification code found")
        score -= 5

    # ── 5. Recipient name ─────────────────────────────────────────────────────
    # Proper name pattern: Two or more capitalized words
    name_pattern = r'\b[A-Z][a-z]{1,20}\s+[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})?\b'
    name_found = re.search(name_pattern, text)
    if name_found:
        positive_signals.append(f"Recipient name detected: {name_found.group()[:40]}")
        score += 10
    else:
        negative_signals.append("No clear recipient name found in document")
        score -= 12

    # ── 6. Text length / content richness ────────────────────────────────────
    word_count = len(text.split())
    if word_count < 15:
        negative_signals.append(f"Very little extractable text ({word_count} words) — may be image-only or blank")
        score -= 20
    elif word_count < 40:
        warning_signals.append(f"Limited text content ({word_count} words) — may be image-based PDF")
        score -= 8
    elif word_count >= 80:
        positive_signals.append(f"Rich document content ({word_count} words extracted)")
        score += 8
    else:
        positive_signals.append(f"Adequate text content found ({word_count} words)")
        score += 4

    # ── 7. URL / verification link ────────────────────────────────────────────
    url_pattern = r'https?://[^\s]{8,}'
    urls = re.findall(url_pattern, text)
    if urls:
        positive_signals.append(f"Verification URL present: {urls[0][:60]}")
        score += 10

    # ── 8. Signature / seal indicators ───────────────────────────────────────
    sig_keywords = ["signature","signed by","authorized signatory","seal","stamp","notarized","registrar"]
    sig_found = [k for k in sig_keywords if k in text_lower]
    if sig_found:
        positive_signals.append(f"Signature/seal indicators found: {', '.join(sig_found[:2])}")
        score += 8

    # ── 9. PDF metadata validation ────────────────────────────────────────────
    if metadata.get("title") or metadata.get("author") or metadata.get("creator"):
        positive_signals.append("PDF metadata present (title/author/creator fields populated)")
        score += 6
    else:
        warning_signals.append("PDF metadata missing — legitimate certificates usually have metadata")
        score -= 3

    # ── 10. Filename validation ───────────────────────────────────────────────
    if filename:
        fn_lower = filename.lower()
        cert_fn_keywords = ["cert","certificate","award","credential","diploma","course"]
        if any(k in fn_lower for k in cert_fn_keywords):
            positive_signals.append(f"Filename suggests certificate document: '{filename}'")
            score += 4

    # ── Final score + verdict ─────────────────────────────────────────────────
    score = max(0, min(100, score))

    if score >= 75:
        verdict       = "LIKELY AUTHENTIC"
        verdict_color = "green"
        verdict_icon  = "✅"
    elif score >= 50:
        verdict       = "POSSIBLY AUTHENTIC"
        verdict_color = "yellow"
        verdict_icon  = "⚠️"
    else:
        verdict       = "SUSPICIOUS / POSSIBLY FAKE"
        verdict_color = "red"
        verdict_icon  = "❌"

    # Skills detected from text
    found_skills = [sk for sk in SKILL_KEYWORDS if sk.lower() in text_lower]

    return {
        "verdict":           verdict,
        "verdict_color":     verdict_color,
        "verdict_icon":      verdict_icon,
        "authenticity_score": score,
        "positive_signals":  positive_signals,
        "negative_signals":  negative_signals,
        "warning_signals":   warning_signals,
        "skills_detected":   found_skills,
        "word_count":        word_count,
        "text_preview":      text[:600] if text else "",
        "metadata":          {k: v for k, v in metadata.items() if v},
        "analyzed_at":       datetime.utcnow().isoformat(),
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@cert_bp.route("", methods=["GET"])
@jwt_required()
def get_all():
    db = get_db()
    certs = list(db.certifications.find({}, {"_id": 0}).sort("submittedAt", -1))
    return jsonify(certs)


@cert_bp.route("/employee/<int:emp_id>", methods=["GET"])
@jwt_required()
def get_by_employee(emp_id):
    db = get_db()
    certs = list(db.certifications.find({"employeeId": emp_id}, {"_id": 0}).sort("submittedAt", -1))
    return jsonify(certs)


@cert_bp.route("/upload", methods=["POST"])
def upload():
    """Employee Portal uploads a certificate (no JWT needed)."""
    emp_id      = request.form.get("employeeId")
    emp_name    = request.form.get("employeeName", "")
    cert_name   = request.form.get("certificateName", "")
    course_name = request.form.get("courseName", "")
    code_skills = request.form.get("codeSkills", "")

    if not emp_id or not cert_name:
        return jsonify({"error": "employeeId and certificateName are required"}), 400

    pdf_data_b64 = None
    filename = ""
    if "file" in request.files:
        f = request.files["file"]
        if f and f.filename:
            filename = f.filename
            pdf_bytes = f.read()
            pdf_data_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

    db = get_db()
    new_id = get_next_id("certifications")
    doc = {
        "id":              new_id,
        "employeeId":      int(emp_id),
        "employeeName":    emp_name,
        "certificateName": cert_name,
        "courseName":      course_name,
        "codeSkills":      code_skills,
        "fileName":        filename,
        "pdfData":         pdf_data_b64,
        "status":          "Pending",
        "submittedAt":     datetime.utcnow().isoformat(),
        "analysisResult":  None,
        "approvedAt":      None,
        "rejectedAt":      None,
        "rejectionReason": "",
    }
    db.certifications.insert_one(doc)
    result = dict(doc)
    result.pop("pdfData", None)
    return jsonify(result), 201


@cert_bp.route("/<int:cert_id>/analyze", methods=["POST"])
def analyze(cert_id):
    """Admin triggers advanced AI analysis of the certificate PDF.
    JWT is accepted when present, but local-admin analysis can still continue
    without failing hard on token issues.
    """
    verify_jwt_in_request(optional=True)
    db = get_db()
    cert = db.certifications.find_one({"id": cert_id})
    if not cert:
        return jsonify({"error": "Certificate not found"}), 404

    pdf_data_b64 = cert.get("pdfData")
    source_type = "pdf"
    if pdf_data_b64:
        try:
            pdf_bytes = base64.b64decode(pdf_data_b64)
            text, metadata = extract_text_advanced(pdf_bytes)
        except Exception as e:
            return jsonify({"error": f"Invalid PDF data: {e}"}), 400
    else:
        source_type = "form-data"
        synthesized_text = "\n".join([
            cert.get("employeeName", ""),
            cert.get("certificateName", ""),
            cert.get("courseName", ""),
            cert.get("codeSkills", ""),
        ]).strip()
        if not synthesized_text:
            return jsonify({"error": "No certificate content available to analyze"}), 400
        text = synthesized_text
        metadata = {"source": "fallback-form-data"}

    # Advanced extraction + analysis
    analysis = analyze_certificate_advanced(text, cert.get("fileName", ""), metadata)

    db.certifications.update_one(
        {"id": cert_id},
        {"$set": {"analysisResult": analysis, "analyzedAt": datetime.utcnow().isoformat(), "analysisSource": source_type}}
    )
    return jsonify({"success": True, "analysis": analysis, "analysisSource": source_type})


@cert_bp.route("/<int:cert_id>/approve", methods=["POST"])
@jwt_required()
def approve(cert_id):
    db = get_db()
    cert = db.certifications.find_one({"id": cert_id})
    if not cert:
        return jsonify({"error": "Certificate not found"}), 404

    now = datetime.utcnow().isoformat()
    db.certifications.update_one(
        {"id": cert_id},
        {"$set": {"status": "Approved", "approvedAt": now}}
    )

    # Auto-update employee profile: add certification + skills
    emp_id    = cert.get("employeeId")
    cert_name = cert.get("certificateName", "")
    analysis  = cert.get("analysisResult") or {}
    if not analysis:
        pdf_data_b64 = cert.get("pdfData")
        if pdf_data_b64:
            try:
                pdf_bytes = base64.b64decode(pdf_data_b64)
                extracted_text, metadata = extract_text_advanced(pdf_bytes)
            except Exception:
                extracted_text, metadata = "", {}
        else:
            extracted_text = "\n".join([
                cert.get("employeeName", ""),
                cert.get("certificateName", ""),
                cert.get("courseName", ""),
                cert.get("codeSkills", ""),
            ]).strip()
            metadata = {"source": "fallback-form-data"}
        if extracted_text:
            analysis = analyze_certificate_advanced(extracted_text, cert.get("fileName", ""), metadata)
            db.certifications.update_one(
                {"id": cert_id},
                {"$set": {"analysisResult": analysis, "analyzedAt": now}}
            )
    new_skills = analysis.get("skills_detected", [])

    if emp_id:
        emp = db.employees.find_one({"id": int(emp_id)})
        if emp:
            existing_certs  = list(emp.get("certifications", []))
            existing_skills = list(emp.get("skills", []))

            if cert_name not in existing_certs:
                existing_certs.append(cert_name)

            existing_lower = [s.lower() for s in existing_skills]
            for sk in new_skills:
                if sk.lower() not in existing_lower:
                    existing_skills.append(sk)
                    existing_lower.append(sk.lower())

            approved_cert_docs = list(emp.get("approvedCertDocs", []))
            approved_cert_docs.append({
                "certId":    cert_id,
                "name":      cert_name,
                "fileName":  cert.get("fileName", ""),
                "approvedAt": now,
            })

            db.employees.update_one(
                {"id": int(emp_id)},
                {"$set": {
                    "certifications":   existing_certs,
                    "skills":           existing_skills,
                    "approvedCertDocs": approved_cert_docs,
                }}
            )

    return jsonify({"success": True, "message": "Certificate approved and profile updated"})


@cert_bp.route("/<int:cert_id>/reject", methods=["POST"])
@jwt_required()
def reject(cert_id):
    data   = request.get_json() or {}
    reason = data.get("reason", "")
    db = get_db()
    cert = db.certifications.find_one({"id": cert_id})
    if not cert:
        return jsonify({"error": "Certificate not found"}), 404
    db.certifications.update_one(
        {"id": cert_id},
        {"$set": {"status": "Rejected", "rejectedAt": datetime.utcnow().isoformat(), "rejectionReason": reason}}
    )
    return jsonify({"success": True, "message": "Certificate rejected"})


@cert_bp.route("/<int:cert_id>/pdf", methods=["GET"])
def get_pdf(cert_id):
    verify_jwt_in_request(optional=True)
    db = get_db()
    cert = db.certifications.find_one({"id": cert_id})
    if not cert:
        return jsonify({"error": "Not found"}), 404
    pdf_b64 = cert.get("pdfData")
    if not pdf_b64:
        return jsonify({"pdfBase64": None, "fileName": cert.get("fileName") or "certificate.pdf", "message": "No PDF attached"})
    return jsonify({"pdfBase64": pdf_b64, "fileName": cert.get("fileName", "certificate.pdf")})
