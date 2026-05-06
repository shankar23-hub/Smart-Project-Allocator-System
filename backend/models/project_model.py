"""
project_model.py  –  MongoDB-backed CRUD for the projects collection.
Fixed version:
- Preserves team array and head object for Employee Portal filtering
- Prevents oversized MongoDB documents
- Sanitizes incoming data
- Avoids storing huge allocationSnapshot payloads
- Safely handles missing/invalid values
"""

from datetime import datetime
from database import get_db, get_next_id
from ai_engine.allocator import build_project_analysis
from models.employee_model import EmployeeModel


def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_list(value):
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def _clean_text(value, default=""):
    if value is None:
        return default
    return str(value).strip()


def _truncate_text(value, max_len=1000):
    value = _clean_text(value)
    return value[:max_len]


def _normalize_head(head_val):
    """Preserve head as dict {name, role} or string."""
    if isinstance(head_val, dict):
        return {
            'name': _clean_text(head_val.get('name', '')),
            'role': _clean_text(head_val.get('role', '')),
            'color': _clean_text(str(head_val.get('color', ''))),
        }
    return _clean_text(head_val)


def _normalize_team(team_val):
    """Preserve team as list of dicts [{name, role, color}]."""
    if not isinstance(team_val, list):
        return []
    result = []
    for m in team_val[:50]:
        if isinstance(m, dict):
            result.append({
                'name': _clean_text(m.get('name', '')),
                'role': _clean_text(m.get('role', '')),
                'color': _clean_text(str(m.get('color', ''))),
            })
        elif isinstance(m, str) and m.strip():
            result.append({'name': m.strip(), 'role': '', 'color': ''})
    return result


def _normalize_project_payload(data: dict, new_id=None) -> dict:
    now = datetime.utcnow().isoformat()

    return {
        'id': new_id if new_id is not None else _safe_int(data.get('id'), 0),
        'name': _clean_text(data.get('name')),
        'head': _normalize_head(data.get('head', '')),
        'team': _normalize_team(data.get('team', [])),
        'status': _clean_text(data.get('status'), 'Pending') or 'Pending',
        'priority': _clean_text(data.get('priority'), 'Medium') or 'Medium',
        'tech': [str(x).strip() for x in _safe_list(data.get('tech')) if str(x).strip()],
        'completion': _safe_int(data.get('completion', data.get('progress', 0)), 0),
        'teamSize': max(1, _safe_int(data.get('teamSize', data.get('team_size', 1)), 1)),
        'deadline': _clean_text(data.get('deadline', data.get('endDate', ''))),
        'endDate': _clean_text(data.get('endDate', data.get('deadline', ''))),
        'startDate': _clean_text(data.get('startDate', data.get('start_date', ''))),
        'description': _truncate_text(data.get('description', ''), 3000),
        'budget': _safe_float(data.get('budget', 0), 0.0),
        'spent': _safe_float(data.get('spent', 0), 0.0),
        'assignedEmployees': [str(x).strip() for x in _safe_list(data.get('assignedEmployees', data.get('assigned_employees', []))) if str(x).strip()],
        'tasks': _safe_list(data.get('tasks', []))[:100],
        'milestones': _safe_list(data.get('milestones', []))[:100],
        'icon': _clean_text(data.get('icon', '📁')) or '📁',
        'color': _clean_text(data.get('color', '#e63946')) or '#e63946',
        'aiSummary': _truncate_text(data.get('aiSummary', ''), 2000),
        'riskLevel': _clean_text(data.get('riskLevel', 'Medium')) or 'Medium',
        'createdAt': data.get('createdAt', now),
        'updatedAt': now,
    }


def _doc_to_dict(doc: dict | None) -> dict | None:
    if doc is None:
        return None

    d = dict(doc)
    d.pop('_id', None)

    d['tech'] = _safe_list(d.get('tech', []))
    d['assignedEmployees'] = _safe_list(d.get('assignedEmployees', []))
    d['tasks'] = _safe_list(d.get('tasks', []))
    d['milestones'] = _safe_list(d.get('milestones', []))
    d['team'] = _normalize_team(d.get('team', []))

    # Ensure head is preserved (dict or string)
    if 'head' not in d:
        d['head'] = ''

    d.setdefault('teamSize', 1)
    d.setdefault('completion', 0)
    d.setdefault('budget', 0.0)
    d.setdefault('spent', 0.0)
    d.setdefault('priority', 'Medium')
    d.setdefault('status', 'Pending')
    d.setdefault('riskLevel', 'Medium')
    d.setdefault('icon', '📁')
    d.setdefault('color', '#e63946')
    d.setdefault('aiSummary', '')
    d.setdefault('recommendedLead', '')
    d.setdefault('workloadInsights', {})
    d.setdefault('endDate', d.get('deadline', ''))
    d.setdefault('deadline', d.get('endDate', ''))

    return d


def _build_safe_snapshot(result: dict) -> dict:
    """
    Store only a very small summary, not the full AI payload.
    This avoids MongoDB document size errors.
    """
    analysis = result.get('analysis', {}) if isinstance(result, dict) else {}
    lead = result.get('lead', {}) if isinstance(result, dict) else {}
    team = result.get('recommendedTeam', []) if isinstance(result, dict) else []

    return {
        'summary': _truncate_text(analysis.get('summary', ''), 500),
        'deliveryRisk': _clean_text(analysis.get('deliveryRisk', 'Medium')) or 'Medium',
        'recommendedLead': _clean_text(lead.get('name', '')),
        'recommendedTeam': [
            {
                'name': _clean_text(member.get('name', '')),
                'role': _clean_text(member.get('role', '')),
            }
            for member in team[:10]
            if isinstance(member, dict)
        ]
    }


def _analysis_payload(data: dict) -> dict:
    employees = EmployeeModel.get_all()
    if not employees:
        return {
            'aiSummary': '',
            'riskLevel': 'Medium',
            'recommendedLead': '',
            'assignedEmployees': data.get('assignedEmployees', []),
            'workloadInsights': {},
            'allocationSnapshot': {},
        }

    result = build_project_analysis(employees, data, data.get('tech', [])) or {}
    analysis = result.get('analysis', {}) if isinstance(result, dict) else {}
    lead = result.get('lead', {}) if isinstance(result, dict) else {}
    team = result.get('recommendedTeam', []) if isinstance(result, dict) else []

    safe_assigned = [
        _clean_text(m.get('name', ''))
        for m in team[:20]
        if isinstance(m, dict) and _clean_text(m.get('name', ''))
    ]

    safe_workload = {
        'summary': _truncate_text(analysis.get('summary', ''), 1000),
        'deliveryRisk': _clean_text(analysis.get('deliveryRisk', 'Medium')) or 'Medium',
    }

    return {
        'aiSummary': safe_workload['summary'],
        'riskLevel': safe_workload['deliveryRisk'],
        'recommendedLead': _clean_text(lead.get('name', '')),
        'assignedEmployees': safe_assigned or data.get('assignedEmployees', []),
        'workloadInsights': safe_workload,
        'allocationSnapshot': _build_safe_snapshot(result),  # small snapshot only
    }


class ProjectModel:
    @staticmethod
    def get_all() -> list[dict]:
        db = get_db()
        docs = db.projects.find({}, {'_id': 0}).sort('id', 1)
        return [_doc_to_dict(d) for d in docs]

    @staticmethod
    def get_by_id(project_id: int) -> dict | None:
        db = get_db()
        doc = db.projects.find_one({'id': int(project_id)}, {'_id': 0})
        return _doc_to_dict(doc)

    @staticmethod
    def create(data: dict) -> dict:
        db = get_db()

        if not data.get('name'):
            raise ValueError("Project name is required")

        new_id = get_next_id('projects')
        base = _normalize_project_payload(data, new_id=new_id)
        # Don't overwrite AI-provided aiSummary and riskLevel if they come from frontend
        if not base.get('aiSummary'):
            base.update(_analysis_payload(base))

        db.projects.insert_one(base)
        return ProjectModel.get_by_id(new_id)

    @staticmethod
    def update(project_id: int, data: dict) -> dict | None:
        db = get_db()
        existing = ProjectModel.get_by_id(project_id)
        if not existing:
            return None

        merged = {**existing, **data}
        update_doc = _normalize_project_payload(merged, new_id=existing['id'])
        update_doc['createdAt'] = existing.get('createdAt', update_doc['createdAt'])
        if not update_doc.get('aiSummary'):
            update_doc.update(_analysis_payload(update_doc))

        db.projects.update_one({'id': int(project_id)}, {'$set': update_doc})
        return ProjectModel.get_by_id(project_id)

    @staticmethod
    def delete(project_id: int) -> bool:
        db = get_db()
        result = db.projects.delete_one({'id': int(project_id)})
        return result.deleted_count > 0

    @staticmethod
    def get_analysis(project_id: int) -> dict | None:
        project = ProjectModel.get_by_id(project_id)
        if not project:
            return None

        employees = EmployeeModel.get_all()
        if not employees:
            return {
                'analysis': {
                    'summary': '',
                    'deliveryRisk': 'Medium'
                },
                'lead': {},
                'recommendedTeam': []
            }

        return build_project_analysis(employees, project, project.get('tech', []))

    @staticmethod
    def get_stats() -> dict:
        projects = ProjectModel.get_all()
        total = len(projects)

        active = sum(1 for p in projects if p.get('status') in {'Active', 'In Progress'})
        pending = sum(1 for p in projects if p.get('status') in {'Pending', 'Planning'})
        review = sum(1 for p in projects if p.get('status') == 'Review')
        completed = sum(1 for p in projects if p.get('status') == 'Completed')

        avg_comp = (
            round(sum(_safe_int(p.get('completion', 0), 0) for p in projects) / total)
            if total else 0
        )

        return {
            'total': total,
            'active': active,
            'pending': pending,
            'review': review,
            'completed': completed,
            'avgCompletion': avg_comp
        }
