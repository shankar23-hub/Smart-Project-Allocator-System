"""
staffid_routes.py – Staff ID generation and Employee Portal credential management.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import get_db, get_next_id
from werkzeug.security import generate_password_hash
import random, string

staffid_bp = Blueprint("staffid", __name__, url_prefix="/api/staff-id")


def _generate_emp_id(employee_id: int, department: str) -> str:
    dept_code = (department or "GEN").replace(" ", "")[:3].upper()
    return f"NXA-{dept_code}-{str(employee_id).zfill(3)}"


def _generate_email(name: str) -> str:
    parts = name.lower().split()
    first = parts[0] if parts else "emp"
    last = parts[-1] if len(parts) > 1 else ""
    return f"{first}.{last}@spa.com" if last else f"{first}@spa.com"


def _generate_password(name: str, emp_id: str) -> str:
    base = name.split()[0].capitalize()
    suffix = emp_id[-3:]
    special = random.choice(["@", "#", "$", "!"])
    return f"{base}{suffix}{special}"


@staffid_bp.route("/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_credentials(employee_id):
    db = get_db()
    rec = db.staff_ids.find_one({"employeeId": employee_id}, {"_id": 0})
    if rec:
        return jsonify({"exists": True, "credentials": rec})
    return jsonify({"exists": False})


@staffid_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate():
    data = request.get_json() or {}
    emp_id_num = data.get("employeeId")
    if not emp_id_num:
        return jsonify({"error": "employeeId required"}), 400

    db = get_db()
    emp = db.employees.find_one({"id": int(emp_id_num)}, {"_id": 0})
    if not emp:
        return jsonify({"error": "Employee not found"}), 404

    emp_id_str = _generate_emp_id(int(emp_id_num), emp.get("department", emp.get("dept", "")))
    email = _generate_email(emp.get("name", ""))
    password = _generate_password(emp.get("name", ""), emp_id_str)

    now = datetime.utcnow().isoformat()
    cred_doc = {
        "employeeId": int(emp_id_num),
        "employeeName": emp.get("name", ""),
        "empId": emp_id_str,
        "email": email,
        "password": password,
        "passwordHash": generate_password_hash(password),
        "generatedAt": now,
        "regeneratedAt": now,
    }

    # Upsert (replace existing if regenerating)
    db.staff_ids.update_one(
        {"employeeId": int(emp_id_num)},
        {"$set": cred_doc},
        upsert=True,
    )

    # Also create/update Employee Portal login
    existing_portal = db.employee_portal_users.find_one({"email": email})
    portal_doc = {
        "employeeId": int(emp_id_num),
        "name": emp.get("name", ""),
        "email": email,
        "passwordHash": generate_password_hash(password),
        "department": emp.get("department", emp.get("dept", "")),
        "role": emp.get("role", ""),
        "empId": emp_id_str,
        "createdAt": now,
    }
    db.employee_portal_users.update_one(
        {"employeeId": int(emp_id_num)},
        {"$set": portal_doc},
        upsert=True,
    )

    result = dict(cred_doc)
    return jsonify({"success": True, "credentials": result})
