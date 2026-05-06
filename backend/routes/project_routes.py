from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, verify_jwt_in_request
from models.project_model import ProjectModel

project_bp = Blueprint('projects', __name__, url_prefix='/api/projects')


@project_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    return jsonify(ProjectModel.get_stats())


@project_bp.route('/<int:project_id>/analysis', methods=['GET'])
@jwt_required()
def get_analysis(project_id):
    analysis = ProjectModel.get_analysis(project_id)
    if not analysis:
        return jsonify({'message': 'Project not found'}), 404
    return jsonify(analysis)


@project_bp.route('', methods=['GET'])
def get_all():
    """
    Public GET /api/projects – accessible both by Admin (JWT) and Employee Portal (no JWT).
    Employee Portal fetches all projects then filters client-side by assigned employee.
    """
    return jsonify(ProjectModel.get_all())


@project_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_one(project_id):
    proj = ProjectModel.get_by_id(project_id)
    if not proj:
        return jsonify({'message': 'Project not found'}), 404
    return jsonify(proj)


@project_bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'name is required'}), 400
    proj = ProjectModel.create(data)
    return jsonify(proj), 201


@project_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update(project_id):
    data = request.get_json()
    proj = ProjectModel.update(project_id, data)
    if not proj:
        return jsonify({'message': 'Project not found'}), 404
    return jsonify(proj)


@project_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete(project_id):
    proj = ProjectModel.get_by_id(project_id)
    if not proj:
        return jsonify({'message': 'Project not found'}), 404
    ProjectModel.delete(project_id)
    return jsonify({'success': True, 'message': 'Project deleted'})
