from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.employee_model import EmployeeModel

employee_bp = Blueprint("employees", __name__, url_prefix="/api/employees")


@employee_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    return jsonify(EmployeeModel.get_stats())


@employee_bp.route("", methods=["GET"])
@jwt_required()
def get_all():
    return jsonify(EmployeeModel.get_all())


@employee_bp.route("/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_one(employee_id):
    emp = EmployeeModel.get_by_id(employee_id)
    if not emp:
        return jsonify({"message": "Employee not found"}), 404
    return jsonify(emp)


@employee_bp.route("", methods=["POST"])
@jwt_required()
def create():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("email"):
        return jsonify({"message": "name and email are required"}), 400
    emp = EmployeeModel.create(data)
    return jsonify(emp), 201


@employee_bp.route("/<int:employee_id>", methods=["PUT"])
@jwt_required()
def update(employee_id):
    data = request.get_json()
    emp  = EmployeeModel.update(employee_id, data)
    if not emp:
        return jsonify({"message": "Employee not found"}), 404
    return jsonify(emp)


@employee_bp.route("/<int:employee_id>", methods=["DELETE"])
@jwt_required()
def delete(employee_id):
    emp = EmployeeModel.get_by_id(employee_id)
    if not emp:
        return jsonify({"message": "Employee not found"}), 404
    EmployeeModel.delete(employee_id)
    return jsonify({"success": True, "message": "Employee deleted"})
