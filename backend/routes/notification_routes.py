"""
notification_routes.py
Stores project allocation notifications for employees.
Employee Portal reads these via GET /api/notifications/employee/<id>
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import get_db, get_next_id

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_bp.route("", methods=["POST"])
@jwt_required()
def create_notification():
    """Admin creates a notification for an employee (called after AI allocation save)."""
    data = request.get_json() or {}
    emp_id = data.get("employeeId")
    if not emp_id:
        return jsonify({"error": "employeeId is required"}), 400

    db     = get_db()
    new_id = get_next_id("notifications")
    doc    = {
        "id":           new_id,
        "employeeId":   int(emp_id),
        "employeeName": data.get("employeeName", ""),
        "type":         data.get("type", "general"),          # e.g. project_allocation
        "role":         data.get("role", ""),                 # Project Head / Team Member
        "projectId":    data.get("projectId"),
        "projectName":  data.get("projectName", ""),
        "message":      data.get("message", "You have a new notification."),
        "read":         False,
        "sentAt":       data.get("sentAt", datetime.utcnow().isoformat()),
        "createdAt":    datetime.utcnow().isoformat(),
    }
    db.notifications.insert_one(doc)
    result = dict(doc)
    result.pop("_id", None)
    return jsonify(result), 201


@notification_bp.route("/employee/<int:emp_id>", methods=["GET"])
def get_employee_notifications(emp_id):
    """Employee Portal reads its own notifications (no JWT – uses emp token separately)."""
    db    = get_db()
    notes = list(
        db.notifications.find({"employeeId": emp_id}, {"_id": 0})
        .sort("createdAt", -1)
        .limit(50)
    )
    return jsonify(notes)


@notification_bp.route("/<int:notif_id>/read", methods=["PATCH"])
def mark_read(notif_id):
    """Employee Portal marks a notification as read."""
    db = get_db()
    db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    return jsonify({"success": True})


@notification_bp.route("/employee/<int:emp_id>/mark-all-read", methods=["PATCH"])
def mark_all_read(emp_id):
    """Mark all notifications for an employee as read."""
    db = get_db()
    db.notifications.update_many({"employeeId": emp_id, "read": False}, {"$set": {"read": True}})
    return jsonify({"success": True})
