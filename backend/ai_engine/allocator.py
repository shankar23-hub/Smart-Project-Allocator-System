"""
allocator.py – SPA AI project allocation engine.

This engine ranks staff using only Staff Profile data plus workload balance:
- Name / role / department
- Skills and certifications
- Experience and performance
- Availability and current workload
- Project requirements from Project Status or ad-hoc allocation
"""

from collections import Counter
from ai_engine.skill_matching import skill_details
from ai_engine.availability_check import is_eligible
from ai_engine.scoring_algorithm import compute_score, score_breakdown


def _dedupe(items):
    out = []
    seen = set()
    for item in items or []:
        key = str(item).strip().lower()
        if key and key not in seen:
            seen.add(key)
            out.append(str(item).strip())
    return out


def _normalize_project(project: dict | None, required_skills: list[str] | None = None) -> dict:
    project = dict(project or {})
    tech = _dedupe(required_skills or project.get('tech', []))
    tasks = list(project.get('tasks', []))
    milestones = list(project.get('milestones', []))
    project.setdefault('name', 'Ad-hoc Allocation')
    project['tech'] = tech
    project['tasks'] = tasks
    project['milestones'] = milestones
    return project


def build_project_analysis(employees: list, project: dict | None = None, required_skills: list | None = None) -> dict:
    project = _normalize_project(project, required_skills)
    skills = project.get('tech', [])
    total_evaluated = len(employees)
    eligible = [e for e in employees if is_eligible(e.get('availability', 'Leave'))]

    scored = []
    dept_counter = Counter()
    for emp in eligible:
        details = skill_details(emp.get('skills', []), skills)
        breakdown = score_breakdown(emp, skills)
        dept = emp.get('department') or emp.get('dept') or 'General'
        dept_counter[dept] += 1
        scored.append({
            **emp,
            'matchScore': compute_score(emp, skills),
            'skillMatches': details['skillMatches'],
            'skillMiss': details['skillMiss'],
            'breakdown': breakdown,
            'departmentResolved': dept,
            'workloadState': 'Balanced' if int(emp.get('currentProjects', 0) or 0) <= 1 else ('Watch' if int(emp.get('currentProjects', 0) or 0) == 2 else 'Overloaded'),
        })

    scored.sort(key=lambda e: (e['matchScore'], -(int(e.get('currentProjects', 0) or 0)), int(e.get('pastPerformance', 0) or 0)), reverse=True)

    best = scored[0] if scored else None
    team = []
    covered = set()
    if best:
        team.append(best)
        covered.update(s.lower() for s in best.get('skillMatches', []))
        for candidate in scored[1:]:
            candidate_matches = {s.lower() for s in candidate.get('skillMatches', [])}
            adds_coverage = bool(candidate_matches - covered)
            under_limit = len(team) < max(2, min(4, int(project.get('teamSize') or 3)))
            if candidate['matchScore'] >= 55 and under_limit and (adds_coverage or len(team) < 2):
                team.append(candidate)
                covered.update(candidate_matches)

    qualified = [e for e in scored if e['matchScore'] >= 60]
    uncovered_skills = [s for s in skills if s.lower() not in covered]
    skill_coverage = round(((len(skills) - len(uncovered_skills)) / len(skills)) * 100) if skills else 0
    overloaded_team = [m['name'] for m in team if int(m.get('currentProjects', 0) or 0) >= 3]

    done_tasks = sum(1 for t in project.get('tasks', []) if t.get('done'))
    total_tasks = len(project.get('tasks', []))
    task_progress = round((done_tasks / total_tasks) * 100) if total_tasks else int(project.get('completion', project.get('progress', 0)) or 0)

    if skill_coverage >= 85 and not overloaded_team:
        delivery_risk = 'Low'
    elif skill_coverage >= 60:
        delivery_risk = 'Medium'
    else:
        delivery_risk = 'High'

    summary_lines = []
    if best:
        summary_lines.append(f"{best['name']} is the strongest lead match at {best['matchScore']}% based on skills, performance, and availability.")
    if team:
        summary_lines.append('Recommended team: ' + ', '.join(m['name'] for m in team) + '.')
    if uncovered_skills:
        summary_lines.append('Missing or weak coverage: ' + ', '.join(uncovered_skills) + '.')
    else:
        summary_lines.append('All required project skills are covered by the recommended team.')
    if overloaded_team:
        summary_lines.append('Workload caution: ' + ', '.join(overloaded_team) + ' already have high active project counts.')
    summary_lines.append(f'Estimated project readiness is {skill_coverage}% with delivery risk marked {delivery_risk}.')

    return {
        'success': True,
        'best': best,
        'team': team[1:] if len(team) > 1 else [],
        'lead': best,
        'recommendedTeam': team,
        'allScored': scored,
        'project': project,
        'stats': {
            'evaluated': total_evaluated,
            'eligible': len(eligible),
            'qualified': len(qualified),
            'skillCoverage': skill_coverage,
            'doneTasks': done_tasks,
            'totalTasks': total_tasks,
            'taskProgress': task_progress,
        },
        'analysis': {
            'deliveryRisk': delivery_risk,
            'uncoveredSkills': uncovered_skills,
            'overloadedTeam': overloaded_team,
            'departmentMix': dict(dept_counter),
            'summary': ' '.join(summary_lines),
        },
    }


def run_allocation(employees: list, project: dict, required_skills: list) -> dict:
    return build_project_analysis(employees, project, required_skills)
