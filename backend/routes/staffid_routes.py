"""
staffid_routes.py – Staff ID generation and Employee Portal credential management.

FIX: Staff ID format changed to SPA10001 (sequential, no dept code).
FIX: Password format changed to SPA@10001 (matches Staff ID number).
FIX: employee_portal_users now stores staffId field (not only email).
FIX: Index added on staffId for fast login lookup.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import get_db, get_next_id
from werkzeug.security import generate_password_hash

staffid_bp = Blueprint("staffid", __name__, url_prefix="/api/staff-id")


def _get_next_staff_number(db) -> int:
    """Atomically increment and return the next SPA staff number (starts at 10001)."""
    result = db.counters.find_one_and_update(
        {"_id": "staff_ids"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = int(result["seq"])
    # First ever call returns 1 → map to 10001
    return seq + 10000


def _generate_staff_id(staff_num: int) -> str:
    """Generate Staff ID in format SPA10001."""
    return f"SPA{staff_num}"


def _generate_staff_password(staff_id: str) -> str:
    """Generate password in format SPA@10001 (SPA@ + numeric part of staff ID)."""
    numeric_part = staff_id[3:]  # strip 'SPA' → '10001'
    return f"SPA@{numeric_part}"


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

    now = datetime.utcnow().isoformat()

    # Check if credentials already exist for this employee
    existing = db.staff_ids.find_one({"employeeId": int(emp_id_num)})
    if existing:
        # Regenerate: keep the same Staff ID number, update password
        staff_id = existing.get("staffId") or existing.get("empId", "")
        # If old format (NXA-...), generate a new SPA-format one
        if not staff_id.startswith("SPA"):
            staff_num = _get_next_staff_number(db)
            staff_id = _generate_staff_id(staff_num)
    else:
        staff_num = _get_next_staff_number(db)
        staff_id = _generate_staff_id(staff_num)

    password = _generate_staff_password(staff_id)
    hashed_pw = generate_password_hash(password)

    cred_doc = {
        "employeeId": int(emp_id_num),
        "employeeName": emp.get("name", ""),
        "staffId": staff_id,
        # Keep empId as alias for backward compatibility
        "empId": staff_id,
        "email": emp.get("email", ""),
        "name": emp.get("name", ""),
        "department": emp.get("department", emp.get("dept", "")),
        "password": password,          # plain – shown once to admin
        "passwordHash": hashed_pw,
        "generatedAt": now,
        "regeneratedAt": now,
    }

    # Upsert staff_ids record
    db.staff_ids.update_one(
        {"employeeId": int(emp_id_num)},
        {"$set": cred_doc},
        upsert=True,
    )

    # Create / update Employee Portal login account (employee_portal_users)
    portal_doc = {
        "employeeId": int(emp_id_num),
        "staffId": staff_id,
        "empId": staff_id,
        "name": emp.get("name", ""),
        "email": emp.get("email", ""),
        "passwordHash": hashed_pw,
        "department": emp.get("department", emp.get("dept", "")),
        "role": emp.get("role", "employee"),
        "status": "active",
        "createdAt": now,
    }
    db.employee_portal_users.update_one(
        {"employeeId": int(emp_id_num)},
        {"$set": portal_doc},
        upsert=True,
    )

    # Ensure staffId index exists for fast login lookups
    try:
        db.employee_portal_users.create_index(
            [("staffId", 1)], unique=True, sparse=True, background=True
        )
    except Exception:
        pass

    result = dict(cred_doc)
    result.pop("passwordHash", None)   # never return the hash
    return jsonify({"success": True, "credentials": result})
