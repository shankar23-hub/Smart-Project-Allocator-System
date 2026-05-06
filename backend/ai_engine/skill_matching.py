"""
Stage 2 – Skill Matching
Cross-references the project's required tech stack against each employee's skills.
Returns a normalised score 0-100.
"""


def skill_score(employee_skills: list, required_skills: list) -> float:
    """
    Percentage of required skills that the employee possesses.
    Returns 50 when no skills are required (neutral — not penalised).
    """
    if not required_skills:
        return 50.0
    matched = [s for s in required_skills if s in employee_skills]
    return (len(matched) / len(required_skills)) * 100


def skill_details(employee_skills: list, required_skills: list) -> dict:
    """Return matched and missing skill lists alongside the score."""
    matched = [s for s in required_skills if s in employee_skills]
    missing = [s for s in required_skills if s not in employee_skills]
    return {
        "skillMatches": matched,
        "skillMiss":    missing,
        "skillScore":   skill_score(employee_skills, required_skills),
    }
