"""
employee_model.py  –  MongoDB-backed CRUD for the employees collection.
"""

from datetime import datetime
from database import get_db, get_next_id

MAX_IMAGE_PREVIEW_CHARS = 260000

def _safe_image_preview(value):
    if not isinstance(value, str):
        return ""
    if value.startswith("data:") and len(value) > MAX_IMAGE_PREVIEW_CHARS:
        return ""
    return value


def _doc_to_dict(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    d = dict(doc)
    d.pop('_id', None)
    d['skills'] = list(d.get('skills', []))
    d['certifications'] = list(d.get('certifications', []))
    d.setdefault('experience', 0)
    d.setdefault('pastPerformance', 75)
    d.setdefault('currentProjects', 0)
    d.setdefault('score', 75)
    d.setdefault('availability', 'Available')
    d.setdefault('country', '')
    d.setdefault('countryCode', '')
    d.setdefault('stateCode', '')
    d['imagePreview'] = _safe_image_preview(d.get('imagePreview', d.get('profileImage', '')))
    d['skills'] = [str(s).strip() for s in d.get('skills', []) if str(s).strip()]
    try:
        d['experience'] = int(d.get('experience', 0) or 0)
    except Exception:
        d['experience'] = 0
    return d


class EmployeeModel:
    @staticmethod
    def get_all() -> list[dict]:
        db = get_db()
        docs = db.employees.find({}, {'_id': 0}).sort('id', 1)
        return [_doc_to_dict(d) for d in docs]

    @staticmethod
    def get_by_id(employee_id: int) -> dict | None:
        db = get_db()
        doc = db.employees.find_one({'id': int(employee_id)}, {'_id': 0})
        return _doc_to_dict(doc)

    @staticmethod
    def create(data: dict) -> dict:
        db = get_db()
        new_id = get_next_id('employees')
        now = datetime.utcnow().isoformat()
        doc = {
            'id': new_id,
            'name': data['name'],
            'role': data.get('role', ''),
            'email': data['email'],
            'phone': data.get('phone', ''),
            'department': data.get('department', ''),
            'skills': list(data.get('skills', [])),
            'certifications': list(data.get('certifications', [])),
            'experience': int(data.get('experience', 0)),
            'availability': data.get('availability', 'Available'),
            'pastPerformance': int(data.get('pastPerformance', data.get('past_performance', 75))),
            'currentProjects': int(data.get('currentProjects', data.get('current_projects', 0))),
            'score': int(data.get('score', 75)),
            'avatar': data.get('avatar', ''),
            'color': data.get('color', '#8B5CF6'),
            'joinDate': data.get('joinDate', data.get('join_date', '')),
            'dob': data.get('dob', ''),
            'father': data.get('father', ''),
            'mother': data.get('mother', ''),
            'address': data.get('address', ''),
            'country': data.get('country', ''),
            'countryCode': data.get('countryCode', ''),
            'state': data.get('state', ''),
            'stateCode': data.get('stateCode', ''),
            'city': data.get('city', ''),
            'imagePreview': _safe_image_preview(data.get('imagePreview', data.get('profileImage', ''))),
            'createdAt': now,
        }
        db.employees.insert_one(doc)
        return EmployeeModel.get_by_id(new_id)

    @staticmethod
    def update(employee_id: int, data: dict) -> dict | None:
        emp = EmployeeModel.get_by_id(employee_id)
        if not emp:
            return None
        merged = {**emp, **data}
        update_doc = {
            'name': merged['name'],
            'role': merged.get('role', ''),
            'email': merged['email'],
            'phone': merged.get('phone', ''),
            'department': merged.get('department', ''),
            'skills': list(merged.get('skills', [])),
            'certifications': list(merged.get('certifications', [])),
            'experience': int(merged.get('experience', 0)),
            'availability': merged.get('availability', 'Available'),
            'pastPerformance': int(merged.get('pastPerformance', merged.get('past_performance', 75))),
            'currentProjects': int(merged.get('currentProjects', merged.get('current_projects', 0))),
            'score': int(merged.get('score', 75)),
            'avatar': merged.get('avatar', ''),
            'color': merged.get('color', '#8B5CF6'),
            'joinDate': merged.get('joinDate', merged.get('join_date', '')),
            'dob': merged.get('dob', ''),
            'father': merged.get('father', ''),
            'mother': merged.get('mother', ''),
            'address': merged.get('address', ''),
            'country': merged.get('country', ''),
            'countryCode': merged.get('countryCode', ''),
            'state': merged.get('state', ''),
            'stateCode': merged.get('stateCode', ''),
            'city': merged.get('city', ''),
            'imagePreview': _safe_image_preview(merged.get('imagePreview', merged.get('profileImage', ''))),
        }
        db = get_db()
        db.employees.update_one({'id': int(employee_id)}, {'$set': update_doc})
        return EmployeeModel.get_by_id(employee_id)

    @staticmethod
    def delete(employee_id: int) -> bool:
        db = get_db()
        db.employees.delete_one({'id': int(employee_id)})
        return True

    @staticmethod
    def get_stats() -> dict:
        employees = EmployeeModel.get_all()
        total = len(employees)
        available = sum(1 for e in employees if e.get('availability') == 'Available')
        busy = sum(1 for e in employees if e.get('availability') == 'Busy')
        on_leave = sum(1 for e in employees if e.get('availability') == 'Leave')
        avg_score = round(sum(int(e.get('score', 75)) for e in employees) / total) if total else 0
        return {'total': total, 'available': available, 'busy': busy, 'onLeave': on_leave, 'avgScore': avg_score}
